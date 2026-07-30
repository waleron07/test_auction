import { type BetItemDto } from '@/shared/api/dto';

import { rankBets } from './lib/bet-ranking.util';
import { addMinutesToNaive, toNaiveDateTime } from './lib/naive-date.util';
import { nextAvailablePrice, noVat, pricePerKm, VAT_RATE_LABEL } from './lib/vat.util';
import { type AuctionEntity } from './model/auction-entity.types';
import { createSeed } from './seed';

/**
 * «Моя личность» в моках.
 *
 * Схема не содержит эндпоинта профиля, а `BetItem.organization_id` нужен,
 * чтобы отличить свою ставку от чужой и посчитать участников (⑬). Значения
 * фиксированные: тесты и UI должны опираться на одну и ту же личность.
 */
export const CURRENT_USER = {
  subscriberId: 900_100,
  organizationId: 700_100,
  organizationName: 'ООО «Перевозчик Тест»',
  organizationInn: '7700123456',
  contactName: 'Иванов Иван',
  contactPhone: '+7 900 000-00-01',
} as const;

interface MockState {
  /** Аукционы по `order_uid` — идентификатору из маршрута (⑱). */
  auctions: Map<string, AuctionEntity>;
  /** Ставки по `auction_id`: связь `order_uid ↔ id` держится консистентной (⑱). */
  bets: Map<number, BetItemDto[]>;
  /** Автоинкремент идентификаторов ставок. */
  nextBetId: number;
}

const createState = (): MockState => {
  const seed = createSeed();

  return {
    auctions: new Map(seed.auctions.map((entity) => [entity.detail.main.order_uid ?? '', entity])),
    bets: new Map(seed.bets),
    nextBetId: seed.nextBetId,
  };
};

let state = createState();

/**
 * Пересоздаёт состояние из сида.
 *
 * Нужен тестам: MSW-стор изменяемый, и ставка, поставленная одним тестом,
 * иначе видна следующему. В приложении вызывается один раз при старте.
 */
export const resetStore = (): void => {
  state = createState();
};

/**
 * Все аукционы в порядке сида.
 * @returns Массив канонических сущностей.
 */
export const getAuctions = (): AuctionEntity[] => [...state.auctions.values()];

/**
 * Аукцион по идентификатору маршрута.
 * @param orderUid Значение `order_uid`.
 * @returns Сущность либо `undefined`, если аукциона нет — хендлер отдаст 404.
 */
export const getAuction = (orderUid: string): AuctionEntity | undefined =>
  state.auctions.get(orderUid);

/**
 * Ставки аукциона в порядке поступления.
 *
 * Принимает сущность, а не идентификатор: связь `order_uid ↔ id` — инвариант
 * стора (⑱), и разыменовывать её в хендлерах значит расселять инвариант по
 * файлам.
 * @param entity Аукцион.
 * @returns Массив ставок; пустой, если ставок нет.
 */
export const getBets = (entity: AuctionEntity): BetItemDto[] =>
  state.bets.get(entity.detail.main.id ?? 0) ?? [];

export interface PlaceBetResult {
  /** Обновлённая сущность — хендлер отдаёт из неё новое состояние. */
  entity: AuctionEntity;
  /** Созданная ставка. */
  bet: BetItemDto;
}

/**
 * Регистрирует ставку и пересчитывает производное состояние.
 *
 * Это самая «серверная» логика проекта: пересчёт мест, торгового статуса,
 * текущей цены и продление времени торгов. Валидация к этому моменту уже
 * пройдена в хендлере (`validateBet`), поэтому здесь только мутация.
 * @param entity Аукцион, на который ставят.
 * @param price Цена ставки — всегда база **с НДС** (⑧).
 * @returns Обновлённая сущность и созданная ставка.
 */
export const placeBet = (entity: AuctionEntity, price: number): PlaceBetResult => {
  const auctionId = entity.detail.main.id ?? 0;
  const aucType = entity.detail.main.auc_type ?? 'Unknown';
  const priceNoVat = noVat(price);

  const bet: BetItemDto = {
    id: state.nextBetId++,
    created_at: toNaiveDateTime(new Date()),
    auction_id: auctionId,
    subscriber_id: CURRENT_USER.subscriberId,
    contact_name: CURRENT_USER.contactName,
    contact_phone: CURRENT_USER.contactPhone,
    price_with_vat: price,
    price_no_vat: priceNoVat,
    organization_id: CURRENT_USER.organizationId,
    organization_inn: CURRENT_USER.organizationInn,
    organization_name: CURRENT_USER.organizationName,
    transporter_comment: null,
    is_rejected: false,
    is_counter: false,
    place: null,
    is_win: false,
    // 0 означает «не задан» — псевдо-пустое значение схемы (⑫).
    run_number: 0,
    cancel_reason: '',
    price_info: {
      price_with_vat: price,
      price_no_vat: priceNoVat,
      payment_type: entity.detail.payment.form ?? 'Безналичный',
      vat_rate: VAT_RATE_LABEL,
    },
  };

  const bets = [...getBets(entity), bet];

  rankBets(bets, aucType);
  state.bets.set(auctionId, bets);

  const trading = entity.detail.trading;

  const step = trading.price?.step ?? null;
  const distance = entity.detail.cargo.distance ?? null;

  const nextPrice = nextAvailablePrice(price, step, aucType);

  trading.price = {
    ...trading.price,
    current: price,
    current_no_vat: priceNoVat,
    // Доступная цена — следующая допустимая: шаг в сторону торгов.
    available: nextPrice,
    available_no_vat: noVat(nextPrice),
    price_per_km: pricePerKm(priceNoVat, distance),
  };

  // rankBets мутирует те же объекты, что лежат в bets: искать свою ставку заново незачем.
  const isLeading = bet.place === 1;

  // Торговый статус пересчитывается по факту: лидер или проигрывающий.
  trading.status_mobile = isLeading ? 'Leading' : 'Losing';
  trading.is_bidder = true;
  // База НДС отправленной ставки — с НДС, иначе мок противоречил бы
  // собственному ответу (⑧).
  trading.is_last_bet_with_vat = true;
  // Detail-проекция `your` содержит четыре поля; в списке их два (㉒).
  trading.your = {
    bet: true,
    last_bet: price,
    last_bet_with_vat: price,
    win: isLeading,
  };

  const prolongMinutes = trading.settings?.prolong_after_bet ?? null;

  if (prolongMinutes !== null && prolongMinutes > 0 && trading.stop_time !== undefined) {
    trading.stop_time = addMinutesToNaive(trading.stop_time, prolongMinutes);
  }

  // Список видит те же изменения: обе проекции собираются из этой сущности,
  // поэтому отдельного обновления «для списка» не существует.
  entity.listOnly.nullPriceInList = false;
  entity.listOnly.nullYourInList = false;

  return { entity, bet };
};
