import {
  type AuctionStatusDto,
  type AuctionTypeDto,
  type BetItemDto,
  type BidMeasurementTypeDto,
  type OperationTypeDto,
  type TradingStatusDto,
} from '@/shared/api/dto';
import { CITIES } from '@/shared/config/cities';

import { rankBets } from './lib/bet-ranking.util';
import { addMinutesToNaive, toNaiveDateTime } from './lib/naive-date.util';
import { nextAvailablePrice, noVat, pricePerKm, VAT_RATE_LABEL } from './lib/vat.util';
import { type AuctionEntity } from './model/auction-entity.types';

/** Точка отсчёта времени сида: «сейчас» на момент старта моков. */
const NOW = new Date();

const naiveShift = (minutes: number): string => addMinutesToNaive(toNaiveDateTime(NOW), minutes);

/** Названия груза: список один, потому что список и маршрут обязаны совпадать. */
const CARGO_NAMES = ['Бумага офисная', 'Комплектующие', 'Плитка керамическая'] as const;

/** Требования к ТС: один литерал на detail и на проекцию списка. */
const TRUCK = {
  type: 'Фура 20т',
  weight: 20,
  volume: 86,
  width: 2.45,
  length: 13.6,
  height: 2.7,
} as const;

/** Детерминированный выбор из списка: сид обязан быть воспроизводимым. */
const pick = <T>(items: readonly T[], index: number): T => {
  const item = items[index % items.length];

  if (item === undefined) throw new Error('Пустой список в сиде.');

  return item;
};

interface AuctionSpec {
  /** Порядковый номер: из него собираются идентификаторы и суммы. */
  index: number;
  aucType?: AuctionTypeDto;
  status?: AuctionStatusDto;
  /** Торговый статус в **detail**; в списке 6 значений вместо 9 (③). */
  statusMobile?: TradingStatusDto;
  bidMeasurementType?: BidMeasurementTypeDto | null;
  canSetBet?: boolean;
  hideBetsHistoryRoot?: boolean;
  hideBetsHistoryTrading?: boolean;
  hidePlaces?: boolean;
  hidePointsAddressAndContacts?: boolean;
  noViewCargoPrice?: boolean;
  isHideOrganization?: boolean;
  /** Все пары `*_no_vat` пустые при заполненных базовых (⑦). */
  emptyNoVatPairs?: boolean;
  /** `trading.price: null` в проекции списка (㉛). */
  nullPriceInList?: boolean;
  /** `trading.your: null` в проекции списка (㉛). */
  nullYourInList?: boolean;
  /** Пустые коллекции контактов и допущенных организаций. */
  emptyCollections?: boolean;
  /** Точек маршрута больше двух — «все точки маршрута» из задания. */
  routePointsCount?: number;
  /** `distance: 0` — проверка деления на ноль в `price_per_km`. */
  zeroDistance?: boolean;
  /** Свой `order_uid`: используется аукционами-триггерами 401 и 503 (⑰). */
  orderUid?: string;
  isBidder?: boolean;
  isAvailable?: boolean;
  isFavorite?: boolean;
  /** Продление торгов после ставки, мин. */
  prolongAfterBet?: number;
}

const createRoutePoints = (
  spec: AuctionSpec,
  loadCityIndex: number,
  unloadCityIndex: number,
): NonNullable<AuctionEntity['detail']['routes']> => {
  const total = spec.routePointsCount ?? 2;
  const points: NonNullable<AuctionEntity['detail']['routes']> = [];

  for (let row = 0; row < total; row += 1) {
    const isLoad = row === 0 || (total > 3 && row === 1);
    const opType: OperationTypeDto =
      total > 3 && row === total - 1 ? 'Unknown' : isLoad ? 'Loading' : 'Unloading';
    const city = pick(CITIES, isLoad ? loadCityIndex + row : unloadCityIndex + row);

    points.push({
      row_num: row + 1,
      op_type: opType,
      start_date: naiveShift(60 * 24 * (row + 1)),
      end_date: naiveShift(60 * 24 * (row + 1) + 120),
      comment: row === 0 ? 'Прибыть за 30 минут до слота' : null,
      contractor: `ООО «Контрагент ${String(row + 1)}»`,
      contractor_inn: `770012${String(3400 + row)}`,
      location: {
        city_name: city.name,
        city_full_name: `${city.name}, Россия`,
        city_gc_id: city.gcId,
        loading_address: `ул. Складская, ${String(10 + row)}`,
        lon: 37.6 + row / 10,
        lat: 55.7 + row / 10,
      },
      cargo: {
        name: pick(CARGO_NAMES, spec.index + row),
        package_name: 'Паллета',
        // Строковые числа — ровно как в схеме, с тремя знаками (㉕).
        weight: '1.000',
        volume: '2.500',
        length: '1.200',
        width: '0.800',
        height: '1.500',
        oversized: false,
        package_amount: 4 + row,
      },
      contact: {
        name: `Петров П. ${String(row + 1)}`,
        // Пустая строка вместо null на первой точке (⑫).
        phone: row === 0 ? '' : '+7 900 111-22-33',
      },
    });
  }

  return points;
};

const createEntity = (spec: AuctionSpec): AuctionEntity => {
  const { index } = spec;
  const id = 1000 + index;
  const orderUid = spec.orderUid ?? `auction-${String(id)}`;
  const aucType =
    spec.aucType ?? pick<AuctionTypeDto>(['Request', 'Up', 'Down', 'FixPrice'], index);
  const status =
    spec.status ?? pick<AuctionStatusDto>(['Auction', 'Planning', 'InProgress'], index);
  const statusMobile = spec.statusMobile ?? 'NotParticipating';
  const loadCityIndex = index;
  const unloadCityIndex = index + 7;
  const loadCity = pick(CITIES, loadCityIndex);
  const unloadCity = pick(CITIES, unloadCityIndex);
  const routePoints = createRoutePoints(spec, loadCityIndex, unloadCityIndex);
  const distance = spec.zeroDistance === true ? 0 : 400 + index * 25;

  const current = 30_000 + index * 1_500;
  const step = 500;
  const min = aucType === 'Down' ? current - step * 10 : current;
  const max = aucType === 'Up' ? current + step * 20 : current + step * 10;
  const hideNoVat = spec.emptyNoVatPairs === true;

  return {
    detail: {
      main: {
        id,
        cargo_num: `A-${String(240_000 + index)}`,
        cargo_date: naiveShift(60 * 24),
        order_uid: orderUid,
        auc_type: aucType,
        created_at: naiveShift(-60 * (index + 1)),
      },
      organizer: {
        subscriber_id: 500_000 + index,
        subscriber_code: `SUB-${String(500_000 + index)}`,
        infobase_code: 'IB-01',
        organization_name: `АО «Грузовладелец ${String(index + 1)}»`,
        organization_inn: `77${String(10_000_000 + index)}`,
        organization_kpp: '770101001',
        organization_id: 600_000 + index,
      },
      contacts:
        spec.emptyCollections === true
          ? []
          : [
              {
                name: 'Сидорова Анна',
                phone: '+7 495 111-11-11',
                // Пустая строка вместо null — сквозной приём схемы (⑫).
                work_phone: '',
                uid: `contact-${String(index)}`,
                email: 'logist@example.com',
              },
            ],
      cargo: {
        // Строка, а не число: так в схеме (㉕).
        price: String(120_000 + index * 1_000),
        currency: 643,
        is_international: index % 9 === 0,
        distance,
        truck_count: 1 + (index % 3),
        body_type: pick(['Тент', 'Изотерм', 'Реф', 'Борт'], index),
        temp_from: null,
        temp_to: null,
        conics: 0,
        belts: 8,
        adr: 0,
        coupling: false,
        air_pass: false,
        low_loader: false,
        additional_load: index % 5 === 0,
        containered: false,
        container_type: null,
        container_size: null,
        loading_types: { side: true, top: index % 2 === 0, rear: true, full: false },
        docs: { tir: false, cmr: index % 3 === 0, t1: false, med: false },
        car: { ...TRUCK },
      },
      trading: {
        status,
        status_mobile: statusMobile,
        start_time: naiveShift(-30),
        stop_time: naiveShift(60 * (2 + (index % 6))),
        // В detail поле не nullable: «не задано» выразимо только в списке,
        // поэтому null из спеки превращается здесь в Unknown, а в проекции
        // списка отдаётся как null через флаг nullBidMeasurementInList (㉚).
        bid_measurement_type:
          spec.bidMeasurementType === undefined
            ? pick<BidMeasurementTypeDto>(['PerRoute', 'PerKm'], index)
            : (spec.bidMeasurementType ?? 'Unknown'),
        can_set_bet: spec.canSetBet ?? true,
        allow_counter_bets: index % 4 === 0,
        // Флаг лежит в схеме в двух местах (⑩), и это два независимых поля,
        // а не одно значение: кейсы «только в корне» и «только в trading» —
        // ровно то, что должен уметь показать мок.
        hide_bets_history: spec.hideBetsHistoryTrading ?? false,
        hide_places: spec.hidePlaces ?? false,
        no_view_cargo_price: spec.noViewCargoPrice ?? false,
        hide_points_address_and_contacts: spec.hidePointsAddressAndContacts ?? false,
        is_bidder: spec.isBidder ?? false,
        is_favorite: spec.isFavorite ?? index % 6 === 0,
        is_last_bet_with_vat: null,
        red_bet_with_vat: false,
        red_bet_no_vat: false,
        send_deal_before_load: index % 7 === 0,
        chat_id: index % 8 === 0 ? `chat-${String(id)}` : null,
        price: {
          start: current,
          start_no_vat: hideNoVat ? null : noVat(current),
          current,
          current_no_vat: hideNoVat ? null : noVat(current),
          available: nextAvailablePrice(current, step, aucType),
          available_no_vat: hideNoVat ? null : noVat(nextAvailablePrice(current, step, aucType)),
          min,
          min_no_vat: hideNoVat ? null : noVat(min),
          max,
          max_no_vat: hideNoVat ? null : noVat(max),
          step,
          step_no_vat: hideNoVat ? null : noVat(step),
          price_per_km: pricePerKm(noVat(current), distance),
        },
        your: { bet: false, last_bet: null, last_bet_with_vat: null, win: false },
        settings: {
          prolong_after_bet: spec.prolongAfterBet ?? (index % 3 === 0 ? 10 : null),
          winner_confirm: 60,
          winner_counter_mode: null,
          transmission_time_in: null,
          coefficient: null,
        },
      },
      payment: {
        condition: 'Оплата по факту выгрузки',
        condition_predefined: null,
        form: 'Безналичный',
        delay: 15 + (index % 3) * 5,
        delay_type: pick(['CalendarDays', 'WorkDays'], index),
        currency_code: 'RUB',
        prepay: null,
      },
      assembly: {
        num: index % 4 === 0 ? `SB-${String(id)}` : null,
        date: index % 4 === 0 ? naiveShift(60 * 12) : null,
      },
      routes: routePoints,
      admitted_organizations:
        spec.emptyCollections === true
          ? []
          : [
              {
                id: 800_000 + index,
                inn: '7700123456',
                is_main: true,
                name: 'ООО «Перевозчик Тест»',
                full_name: 'Общество с ограниченной ответственностью «Перевозчик Тест»',
                site: null,
                subscriber_id: 900_100,
                subscriber_code: 'SUB-900100',
                subscriber_role: 'carrier',
                infobase_code: 'IB-02',
                infobase_address: null,
                nalog_key: null,
                hide_me: index % 11 === 0,
                current_vat_rate: VAT_RATE_LABEL,
              },
            ],
      hide_bets_history: spec.hideBetsHistoryRoot ?? false,
    },
    listOnly: {
      prioritySort: index,
      isHideOrganization: spec.isHideOrganization ?? false,
      comment: index % 5 === 0 ? 'Погрузка строго по слоту' : '',
      isAvailable: spec.isAvailable ?? true,
      isAccredited: index % 3 !== 0,
      cargoName: pick(CARGO_NAMES, index),
      cargoWeight: 20 - (index % 5),
      cargoVolume: 86 - (index % 7),
      incoterms: index % 9 === 0 ? 'DAP' : '',
      isCargo: true,
      car: { ...TRUCK },
      load: {
        city: loadCity.name,
        address: `ул. Складская, 10`,
        date: naiveShift(60 * 24),
        cityGcId: loadCity.gcId,
      },
      unload: {
        city: unloadCity.name,
        address: `пр. Промышленный, 4`,
        date: naiveShift(60 * 48),
        cityGcId: unloadCity.gcId,
      },
      consignor: `АО «Грузовладелец ${String(index + 1)}»`,
      consignee: 'ООО «Получатель»',
      nullPriceInList: spec.nullPriceInList ?? false,
      nullYourInList: spec.nullYourInList ?? false,
      nullBidMeasurementInList: spec.bidMeasurementType === null,
    },
  };
};

/**
 * Идентификаторы аукционов-триггеров ошибок (⑰).
 *
 * 401 и 503 объявлены у всех четырёх операций, и без способа их вызвать
 * соответствующие экраны остались бы непроверяемыми. Триггер — сам аукцион,
 * а не переключатель в UI: ссылка на него воспроизводима.
 */
export const ERROR_TRIGGER_UIDS = {
  unauthorized: 'auction-401-unauthorized',
  serviceUnavailable: 'auction-503-unavailable',
} as const;

/**
 * Именованные якоря сида для тестов.
 *
 * Тесту нужен «аукцион с продлением торгов» или «аукцион с отменёнными
 * ставками», и найти его перебором выдачи он может только зная внутреннее
 * устройство сида — то есть повторяя его в неявной форме. Якорь делает связь
 * явной: кейс объявлен там же, где создан, а перестановка сида не превращает
 * тест в проверку другого аукциона.
 */
export const SEED_CASE_UIDS = {
  /** Торги на понижение, ставить можно, `prolong_after_bet` задан. */
  biddableProlonged: 'auction-biddable-prolonged',
  /** Ставки есть, среди них отменённые обоих видов (⑫). */
  withCanceledBets: 'auction-with-canceled-bets',
  /** `can_set_bet: false` — ставка обязана получить 422. */
  notBiddable: 'auction-not-biddable',
} as const;

interface SeedData {
  auctions: AuctionEntity[];
  bets: [number, BetItemDto[]][];
  nextBetId: number;
}

const createOtherBet = (
  betId: number,
  auctionId: number,
  index: number,
  price: number,
  overrides: Partial<BetItemDto> = {},
): BetItemDto => ({
  id: betId,
  created_at: naiveShift(-60 * (index + 1)),
  auction_id: auctionId,
  subscriber_id: 910_000 + index,
  contact_name: `Контакт ${String(index + 1)}`,
  // Пустая строка = телефон не задан (⑫).
  contact_phone: index % 3 === 0 ? '' : '+7 901 222-33-44',
  price_with_vat: price,
  price_no_vat: noVat(price),
  organization_id: 710_000 + index,
  organization_inn: `78${String(20_000_000 + index)}`,
  // Пустая строка = название не задано (⑫).
  organization_name: index % 4 === 0 ? '' : `ООО «Перевозчик ${String(index + 1)}»`,
  transporter_comment: index % 5 === 0 ? 'Готовы выехать сегодня' : null,
  is_rejected: false,
  is_counter: index % 6 === 0,
  place: null,
  is_win: false,
  run_number: index % 2 === 0 ? 0 : 12 + index,
  cancel_reason: '',
  price_info: {
    price_with_vat: price,
    price_no_vat: noVat(price),
    payment_type: 'Безналичный',
    vat_rate: VAT_RATE_LABEL,
  },
  ...overrides,
});

/**
 * Проверяет инварианты сида и падает громко, если они нарушены.
 *
 * Данные сида — **наши собственные**, а не пришедшие извне, поэтому здесь
 * уместна проверка «этого не может быть», а не деградация. Место проверки —
 * сборка сида, а не валидация ставки: при старте она проверяет все 60
 * аукционов сразу и с внятным сообщением, тогда как проверка внутри
 * `validateBet` сработала бы лениво, только для того аукциона, на который
 * кто-то поставил, и превратила бы ошибку данных в непонятный сбой запроса.
 *
 * Прод-код таких проверок не делает: там данные приходят от сервера, и
 * `isMultipleOf` намеренно трактует испорченный шаг как отсутствие
 * ограничения — блокировать пользователю единственное бизнес-действие
 * из-за чужих данных нельзя (обоснование — в JSDoc утилиты).
 * @param auctions Собранные аукционы.
 * @throws {Error} Если сид противоречит собственным правилам.
 */
const assertSeedInvariants = (auctions: AuctionEntity[]): void => {
  const seenUids = new Set<string>();

  for (const entity of auctions) {
    const orderUid = entity.detail.main.order_uid ?? '';
    const step = entity.detail.trading.price?.step ?? null;

    if (orderUid === '') {
      throw new Error('Инвариант сида: у аукциона пустой order_uid.');
    }

    if (seenUids.has(orderUid)) {
      throw new Error(`Инвариант сида: дублирующийся order_uid ${orderUid}.`);
    }

    seenUids.add(orderUid);

    if (step !== null && step <= 0) {
      throw new Error(`Инвариант сида: шаг ставки должен быть больше нуля (${orderUid}).`);
    }
  }
};

/**
 * Собирает начальное состояние моков.
 *
 * Сид покрывает ветки UI явными кейсами, а не «случайными данными»: каждая
 * ловушка контракта должна быть видна на демонстрации без подготовки данных
 * руками. Перечень кейсов — в плане, фаза 3.2.
 * @returns Аукционы, ставки и следующий идентификатор ставки.
 */
export const createSeed = (): SeedData => {
  const specs: AuctionSpec[] = [];
  let index = 0;

  const push = (spec: Omit<AuctionSpec, 'index'>): void => {
    specs.push({ index, ...spec });
    index += 1;
  };

  // Каждый тип аукциона, включая Unknown — проверка фолбэка ④.
  for (const aucType of ['Request', 'Up', 'Down', 'FixPrice', 'Unknown'] as AuctionTypeDto[]) {
    push({ aucType });
  }

  // Все 8 статусов аукциона плюс Unknown: бейджи и disabled-состояния.
  for (const status of [
    'Planning',
    'Auction',
    'DeterminateWinner',
    'WaitDeal',
    'InProgress',
    'Finished',
    'Stopped',
    'Canceled',
    'Unknown',
  ] as AuctionStatusDto[]) {
    push({ status, canSetBet: status === 'Auction' });
  }

  // Все 9 значений TradingStatus — только в detail; список отдаёт 6 (③).
  for (const statusMobile of [
    'NotParticipating',
    'Leading',
    'Losing',
    'OnPending',
    'Confirmed',
    'ChoosingWinner',
    'Winner',
    'Accepted',
    'Unknown',
  ] as TradingStatusDto[]) {
    push({ statusMobile, isBidder: statusMobile !== 'NotParticipating' });
  }

  // Единица измерения ставки: за рейс, за км и не заданная (㉚).
  push({ bidMeasurementType: 'PerRoute' });
  push({ bidMeasurementType: 'PerKm' });
  push({ bidMeasurementType: null });
  push({ bidMeasurementType: 'Unknown' });

  // Nullable-объекты проекции списка (㉛).
  push({ nullPriceInList: true });
  push({ nullYourInList: true });
  push({ nullPriceInList: true, nullYourInList: true });

  // Флаги ограничений: каждый отдельно, чтобы ветку было видно.
  push({ canSetBet: false });
  push({ hideBetsHistoryRoot: true });
  push({ hideBetsHistoryTrading: true });
  push({ hideBetsHistoryRoot: true, hideBetsHistoryTrading: true });
  push({ hidePlaces: true });
  push({ hidePointsAddressAndContacts: true });
  push({ noViewCargoPrice: true });
  push({ isHideOrganization: true });
  push({ emptyCollections: true });
  push({ emptyNoVatPairs: true });
  push({ zeroDistance: true });
  push({ routePointsCount: 5 });
  push({ isAvailable: false });
  push({ isFavorite: true });

  // Триггеры серверных ошибок (⑰).
  push({ orderUid: ERROR_TRIGGER_UIDS.unauthorized });
  push({ orderUid: ERROR_TRIGGER_UIDS.serviceUnavailable });

  // Якоря для тестов: кейс объявлен там же, где создан.
  push({
    orderUid: SEED_CASE_UIDS.biddableProlonged,
    aucType: 'Down',
    status: 'Auction',
    canSetBet: true,
    prolongAfterBet: 10,
  });
  push({ orderUid: SEED_CASE_UIDS.withCanceledBets, aucType: 'Down', canSetBet: true });
  push({ orderUid: SEED_CASE_UIDS.notBiddable, canSetBet: false });

  // Наполнение до ~60 записей: пагинация и фильтры должны работать на объёме.
  while (specs.length < 60) {
    push({});
  }

  const auctions = specs.map(createEntity);

  const bets: [number, BetItemDto[]][] = [];
  let betId = 5000;

  auctions.forEach((entity, position) => {
    const auctionId = entity.detail.main.id ?? 0;

    // Каждый десятый аукцион — без ставок: empty state должен быть виден.
    if (position % 10 === 3) {
      bets.push([auctionId, []]);

      return;
    }

    const basePrice = entity.detail.trading.price?.current ?? 30_000;
    const auctionBets: BetItemDto[] = [
      createOtherBet(betId++, auctionId, position, basePrice + 500),
      createOtherBet(betId++, auctionId, position + 1, basePrice + 1_000),
    ];

    // Отменённые ставки двух видов: по флагу и по непустой причине (⑫).
    if (position % 5 === 0 || entity.detail.main.order_uid === SEED_CASE_UIDS.withCanceledBets) {
      auctionBets.push(
        createOtherBet(betId++, auctionId, position + 2, basePrice + 250, {
          is_rejected: true,
          cancel_reason: '',
        }),
        createOtherBet(betId++, auctionId, position + 3, basePrice + 300, {
          is_rejected: false,
          cancel_reason: 'Отменена организатором: не пройдена аккредитация',
        }),
      );
    }

    // Места расставляются той же функцией, что и после ставки: иначе рейтинг
    // «до» и «после» считался бы по разным правилам (на повышение лучший —
    // максимум, а не минимум).
    rankBets(auctionBets, entity.detail.main.auc_type ?? 'Unknown');

    bets.push([auctionId, auctionBets]);
  });

  assertSeedInvariants(auctions);

  return { auctions, bets, nextBetId: betId };
};
