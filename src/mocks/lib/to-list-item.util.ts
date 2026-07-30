import {
  type AuctionListItemDto,
  type AuctionShowResponseDto,
  type TradingStatusDto,
} from '@/shared/api/dto';

import { type AuctionEntity } from '../model/auction-entity.types';

/**
 * Значения `TradingStatus`, которых **нет** в инлайновом enum'е
 * `AuctionListItemTrading.status_mobile` (③).
 *
 * Общая схема объявляет 9 значений, список — 6. Отдать в списке `OnPending`
 * значит нарушить собственный контракт, поэтому такие статусы вырождаются в
 * `Unknown` — и это ровно то поведение, которое проверяет фолбэк ④ на клиенте.
 */
const DETAIL_ONLY_TRADING_STATUSES: readonly TradingStatusDto[] = [
  'OnPending',
  'ChoosingWinner',
  'Accepted',
];

/** Торговый блок проекции списка. */
type ListTrading = NonNullable<AuctionListItemDto['trading']>;

/** Статус списка: 6 допустимых значений вместо 9. */
type ListTradingStatus = NonNullable<ListTrading['status_mobile']>;

/**
 * Цена и «моя ставка» в списке объявлены nullable, но **не** optional:
 * `exactOptionalPropertyTypes` требует различать `null` и отсутствие поля.
 */
type ListPrice = Exclude<ListTrading['price'], undefined>;
type ListYour = Exclude<ListTrading['your'], undefined>;

const toListTradingStatus = (status: TradingStatusDto | undefined): ListTradingStatus => {
  if (status === undefined) return 'Unknown';

  return DETAIL_ONLY_TRADING_STATUSES.includes(status) ? 'Unknown' : (status as ListTradingStatus);
};

/**
 * Цена в списке: три поля вместо шести пар detail (㉓).
 * @param price Блок цен detail-проекции.
 * @param nullPriceInList Отдать `null` вместо блока цены — случай ㉛.
 * @returns Цена проекции списка либо `null`.
 */
const toListPrice = (
  price: AuctionShowResponseDto['trading']['price'],
  nullPriceInList: boolean,
): ListPrice => {
  if (nullPriceInList || price?.current === null || price?.current === undefined) return null;

  return {
    start: price.start ?? price.current,
    current: price.current,
    // Единственная пара без НДС, доступная в списке (㉓).
    current_no_vat: price.current_no_vat ?? price.current,
  };
};

/**
 * Своя ставка в списке: два поля вместо четырёх (㉒).
 * @param your Блок «моя ставка» detail-проекции.
 * @param nullYourInList Отдать `null` вместо блока — случай ㉛.
 * @returns Блок «моя ставка» проекции списка либо `null`.
 */
const toListYour = (
  your: AuctionShowResponseDto['trading']['your'],
  nullYourInList: boolean,
): ListYour => {
  if (nullYourInList || your === undefined) return null;

  // `last_bet_with_vat` и `win` здесь недопустимы: их нет в схеме объекта
  // списка, и сгенерированный тип их не пропустит.
  return { bet: your.bet ?? false, last_bet: your.last_bet ?? null };
};

/**
 * Собирает проекцию списка из канонической сущности.
 *
 * Это одно из двух мест, где живёт асимметрия проекций. Второе —
 * `toShowResponse`. Всё остальное в моках работает с канонической сущностью и о
 * различиях DTO не знает.
 * @param entity Каноническая сущность аукциона.
 * @returns Элемент ответа `POST /auctions/list`.
 */
export const toListItem = (entity: AuctionEntity): AuctionListItemDto => {
  const { detail, listOnly } = entity;
  const main = detail.main;
  const trading = detail.trading;
  const cargo = detail.cargo;
  // Счётчики точек — производные от маршрута, а не отдельно хранимые числа.
  const loadPointsCount = detail.routes.filter((point) => point.op_type === 'Loading').length;

  return {
    main: {
      id: main.id ?? 0,
      cargo_num: main.cargo_num ?? '',
      cargo_date: main.cargo_date ?? '',
      auc_type: main.auc_type ?? 'Unknown',
      order_uid: main.order_uid ?? '',
      created_at: main.created_at ?? '',
      priority_sort: listOnly.prioritySort,
      // Признак сборного груза выводится из самого объекта сборки.
      is_assembly: detail.assembly.num !== null,
      // Цена за км считается сервером; при distance = 0 деления нет (⑦).
      price_per_km: trading.price?.price_per_km ?? null,
    },
    organizer: {
      subscriber_id: detail.organizer.subscriber_id ?? 0,
      organization_id: detail.organizer.organization_id ?? 0,
      organization_name: detail.organizer.organization_name ?? '',
      organization_inn: detail.organizer.organization_inn ?? '',
      organization_kpp: detail.organizer.organization_kpp ?? '',
      is_hide_organization: listOnly.isHideOrganization,
    },
    route: {
      load: {
        city: listOnly.load.city,
        address: listOnly.load.address,
        date: listOnly.load.date,
        city_gc_id: listOnly.load.cityGcId,
        points_count: loadPointsCount,
      },
      unload: {
        city: listOnly.unload.city,
        address: listOnly.unload.address,
        date: listOnly.unload.date,
        city_gc_id: listOnly.unload.cityGcId,
        points_count: Math.max(detail.routes.length - loadPointsCount, 1),
      },
    },
    cargo: {
      name: listOnly.cargoName,
      weight: listOnly.cargoWeight,
      volume: listOnly.cargoVolume,
      body_type: cargo.body_type ?? '',
      truck_count: cargo.truck_count ?? 1,
      is_cargo: listOnly.isCargo,
      is_international: cargo.is_international ?? false,
      containered: cargo.containered ?? false,
      incoterms: listOnly.incoterms,
      conics: cargo.conics ?? 0,
      belts: cargo.belts ?? 0,
      adr: cargo.adr ?? 0,
      coupling: cargo.coupling ?? false,
      air_pass: cargo.air_pass ?? false,
      low_loader: cargo.low_loader ?? false,
      additional_load: cargo.additional_load ?? false,
      temp_from: cargo.temp_from ?? 0,
      temp_to: cargo.temp_to ?? 0,
      loading_types: {
        side: cargo.loading_types?.side ?? false,
        top: cargo.loading_types?.top ?? false,
        rear: cargo.loading_types?.rear ?? false,
        full: cargo.loading_types?.full ?? false,
      },
      docs: {
        tir: cargo.docs?.tir ?? false,
        cmr: cargo.docs?.cmr ?? false,
        t1: cargo.docs?.t1 ?? false,
        med: cargo.docs?.med ?? false,
      },
      car: listOnly.car,
    },
    trading: {
      status: trading.status ?? 'Unknown',
      status_mobile: toListTradingStatus(trading.status_mobile),
      start_time: trading.start_time ?? '',
      stop_time: trading.stop_time ?? '',
      bid_measurement_type: listOnly.nullBidMeasurementInList
        ? null
        : (trading.bid_measurement_type ?? null),
      can_set_bet: trading.can_set_bet ?? false,
      allow_counter_bets: trading.allow_counter_bets ?? false,
      hide_points_address_and_contacts: trading.hide_points_address_and_contacts ?? false,
      direction: `${listOnly.load.city} → ${listOnly.unload.city}`,
      comment: listOnly.comment,
      is_bidder: trading.is_bidder ?? false,
      is_available: listOnly.isAvailable,
      is_accredited: listOnly.isAccredited,
      is_favorite: trading.is_favorite ?? false,
      price: toListPrice(trading.price, listOnly.nullPriceInList),
      your: toListYour(trading.your, listOnly.nullYourInList),
      red_bet_with_vat: trading.red_bet_with_vat ?? false,
      red_bet_no_vat: trading.red_bet_no_vat ?? false,
      // В списке поле не nullable, в detail — nullable (⑧).
      is_last_bet_with_vat: trading.is_last_bet_with_vat ?? false,
    },
    payment: {
      form: detail.payment.form ?? '',
      currency_code: detail.payment.currency_code ?? '',
      consignor: listOnly.consignor,
      consignee: listOnly.consignee,
    },
  };
};
