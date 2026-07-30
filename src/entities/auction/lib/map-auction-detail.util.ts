import { type AuctionShowResponseDto } from '@/shared/api/dto';
import { formatDateRange } from '@/shared/lib/date/format-date-range.util';
import { AUCTION_TYPE_DICT } from '@/shared/lib/enums/auction-type.dict';
import { getEnumEntry } from '@/shared/lib/enums/get-enum-label.util';
import { OPERATION_TYPE_DICT } from '@/shared/lib/enums/operation-type.dict';
import { PAYMENT_DELAY_TYPE_DICT } from '@/shared/lib/enums/payment-delay-type.dict';
import { TRADING_STATUS_DICT } from '@/shared/lib/enums/trading-status.dict';
import { formatMoney } from '@/shared/lib/number/format-money.util';
import { formatPrice } from '@/shared/lib/number/format-price.util';
import { resolvePriceUnit } from '@/shared/lib/number/resolve-price-unit.util';
import { toNumber } from '@/shared/lib/number/to-number.util';
import { emptyToNull } from '@/shared/lib/string/empty-to-null.util';
import { DASH, NBSP } from '@/shared/lib/string/typography.const';
import { type VatMode } from '@/shared/model/vat-mode.store';

import {
  type AuctionCargoDetailVm,
  type AuctionDetailVm,
  type AuctionPaymentVm,
  type AuctionTradingVm,
  type CarRequirementsVm,
  type RoutePointVm,
} from '../model/auction.types';

import { HIDDEN_BY_ORGANIZER } from './hidden-value.const';
import { mapAuctionPermissions } from './map-auction-permissions.util';
import { type PricePair, selectPrice } from './select-price.util';

/**
 * Строка контракта либо прочерк: пустая строка в этой схеме означает «не
 * задано» (⑫).
 * @param value Значение из DTO.
 * @returns Текст для рендера.
 */
const text = (value: string | null | undefined): string => emptyToNull(value) ?? DASH;

/**
 * Число с единицей измерения либо прочерк.
 * @param value Значение из DTO.
 * @param unit Единица измерения — «т», «м³», «км».
 * @returns Текст для рендера.
 */
const amount = (value: number | null | undefined, unit: string): string =>
  value === null || value === undefined ? DASH : `${String(value)}${NBSP}${unit}`;

/**
 * Выбирает половину ценовой пары и форматирует с единицей измерения.
 *
 * Обёртка над `selectPrice` + `formatPrice`: в маппере detail такая пара
 * встречается шесть раз (current/available/min/max/step/своя ставка), и
 * решение «что показать при отсутствии значения» должно приниматься одинаково
 * во всех шести местах, а не по одному в каждом.
 * @param pair Пара значений «с НДС / без НДС».
 * @param vatMode Текущий режим отображения.
 * @param unit Единица измерения цены.
 * @returns Отформатированный текст и признак фолбэка на базовое значение.
 */
const priceField = (
  pair: PricePair,
  vatMode: VatMode,
  unit: ReturnType<typeof resolvePriceUnit>,
): { text: string; isFallback: boolean } => {
  const selected = selectPrice(pair, vatMode);

  return { text: formatPrice(selected.value, unit), isFallback: selected.usedFallback };
};

/**
 * Собирает требования к транспортному средству.
 *
 * `CarRequirements` помечена nullable на уровне самой схемы (㉛): объект может
 * быть `null`, `undefined` или заполнен частично. И то, и другое означает
 * «требований нет» — компонент получает единый `null`, а не два разных пути
 * его выразить.
 * @param car Требования к ТС из `AuctionShowCargo.car`.
 * @returns ViewModel требований либо `null`, если требований нет.
 */
const mapCar = (car: AuctionShowResponseDto['cargo']['car']): CarRequirementsVm | null => {
  if (car === null || car === undefined) return null;

  const length = toNumber(car.length);
  const width = toNumber(car.width);
  const height = toNumber(car.height);
  const dimensions =
    length === null || width === null || height === null
      ? DASH
      : `${String(length)} × ${String(width)} × ${String(height)} м`;

  return {
    type: text(car.type),
    weight: amount(toNumber(car.weight), 'т'),
    volume: amount(toNumber(car.volume), 'м³'),
    dimensions,
  };
};

/**
 * Название груза для detail (㉔).
 *
 * `AuctionShowCargo` названия не содержит вовсе — оно есть только в
 * `routes[].cargo.name`. Если по точкам маршрута названия расходятся,
 * перечисляем все — выбор одного значения из нескольких был бы придумыванием
 * данных, которых в контракте нет.
 * @param routes Точки маршрута.
 * @returns Название груза либо перечисление через « / », либо прочерк.
 */
const resolveCargoName = (routes: AuctionShowResponseDto['routes']): string => {
  const names = new Set(
    routes.map((point) => emptyToNull(point.cargo?.name)).filter((name) => name !== null),
  );

  return names.size === 0 ? DASH : [...names].join(' / ');
};

/**
 * Собирает груз: сведения `AuctionShowCargo` плюс название из точек маршрута.
 * @param detail Ответ `GET /auctions/{auctionUuid}`.
 * @param noViewCargoPrice Разрешение показывать цену груза.
 * @returns ViewModel секции груза.
 */
const mapCargo = (
  detail: AuctionShowResponseDto,
  noViewCargoPrice: boolean,
): AuctionCargoDetailVm => {
  const cargo = detail.cargo;
  const chips: [boolean | undefined, string][] = [
    [cargo.loading_types?.side, 'Боковая'],
    [cargo.loading_types?.top, 'Верхняя'],
    [cargo.loading_types?.rear, 'Задняя'],
    [cargo.loading_types?.full, 'Полная'],
  ];
  const docChips: [boolean | undefined, string][] = [
    [cargo.docs?.tir, 'TIR'],
    [cargo.docs?.cmr, 'CMR'],
    [cargo.docs?.t1, 'T1'],
    [cargo.docs?.med, 'Мед. книжка'],
  ];

  return {
    name: resolveCargoName(detail.routes),
    price: noViewCargoPrice ? HIDDEN_BY_ORGANIZER : formatMoney(toNumber(cargo.price)),
    bodyType: text(cargo.body_type),
    truckCount: cargo.truck_count ?? 1,
    distance: amount(cargo.distance ?? null, 'км'),
    loadingTypes: chips.filter(([enabled]) => enabled === true).map(([, label]) => label),
    docs: docChips.filter(([enabled]) => enabled === true).map(([, label]) => label),
    car: mapCar(cargo.car),
  };
};

/**
 * Собирает все точки маршрута.
 * @param routes Точки маршрута из detail.
 * @param hidePointsAddressAndContacts Разрешение показывать адрес и контакт точки.
 * @returns ViewModel точек маршрута.
 */
const mapRoute = (
  routes: AuctionShowResponseDto['routes'],
  hidePointsAddressAndContacts: boolean,
): RoutePointVm[] =>
  routes.map((point) => ({
    operation: getEnumEntry(OPERATION_TYPE_DICT, point.op_type),
    city: text(point.location?.city_name),
    address: hidePointsAddressAndContacts
      ? HIDDEN_BY_ORGANIZER
      : text(point.location?.loading_address),
    date: formatDateRange(point.start_date, point.end_date),
    contactName: hidePointsAddressAndContacts ? HIDDEN_BY_ORGANIZER : text(point.contact?.name),
    contactPhone: hidePointsAddressAndContacts ? HIDDEN_BY_ORGANIZER : text(point.contact?.phone),
  }));

/**
 * Собирает условия оплаты.
 * @param payment Блок `payment` из detail.
 * @returns ViewModel условий оплаты.
 */
const mapPayment = (payment: AuctionShowResponseDto['payment']): AuctionPaymentVm => {
  const days = payment.delay ?? null;
  const delayType = getEnumEntry(PAYMENT_DELAY_TYPE_DICT, payment.delay_type);
  const delay = days === null ? DASH : `${String(days)} ${delayType.label}`;

  return {
    form: text(payment.form),
    condition: text(payment.condition),
    delay,
    prepay:
      payment.prepay === null || payment.prepay === undefined
        ? DASH
        : formatMoney(toNumber(payment.prepay)),
  };
};

/**
 * Своя ставка и параметры торгов.
 *
 * `your.last_bet` / `your.last_bet_with_vat` нарушают привычный для схемы
 * порядок суффиксов (обычно `X` — база с НДС, `X_no_vat` — без). Здесь имя
 * поля читается буквально: `last_bet_with_vat` содержит сумму **с** НДС,
 * `last_bet` — без. Решение принято по смыслу названия поля, а не по общему
 * шаблону контракта — irregularity задокументирована здесь, а не молча
 * скопирована с других пар.
 * @param detail Ответ `GET /auctions/{auctionUuid}`.
 * @param vatMode Текущий режим отображения цен.
 * @returns ViewModel параметров торгов и своей ставки.
 */
const mapTrading = (detail: AuctionShowResponseDto, vatMode: VatMode): AuctionTradingVm => {
  const trading = detail.trading;
  const price = trading.price;
  const unit = resolvePriceUnit(trading.bid_measurement_type);
  const your = trading.your;

  return {
    status: getEnumEntry(TRADING_STATUS_DICT, trading.status_mobile),
    startDate: formatDateRange(trading.start_time, null),
    stopDate: formatDateRange(trading.stop_time, null),
    current: priceField({ withVat: price?.current, noVat: price?.current_no_vat }, vatMode, unit),
    available: priceField(
      { withVat: price?.available, noVat: price?.available_no_vat },
      vatMode,
      unit,
    ),
    min: priceField({ withVat: price?.min, noVat: price?.min_no_vat }, vatMode, unit),
    max: priceField({ withVat: price?.max, noVat: price?.max_no_vat }, vatMode, unit),
    step: priceField({ withVat: price?.step, noVat: price?.step_no_vat }, vatMode, unit),
    pricePerKm: price?.price_per_km === undefined ? DASH : `${formatMoney(price.price_per_km)}/км`,
    allowCounterBets: trading.allow_counter_bets === true,
    hasMyBet: your?.bet === true,
    myBet: priceField({ withVat: your?.last_bet_with_vat, noVat: your?.last_bet }, vatMode, unit),
    isWinner: your?.win === true,
    prolongAfterBetMinutes: trading.settings?.prolong_after_bet ?? null,
  };
};

/**
 * Собирает ViewModel детальной страницы.
 *
 * Как и `mapAuctionCard`, здесь заканчивается зона, где поля могут
 * отсутствовать или требовать выбора: `permissions` вычисляются один раз через
 * `mapAuctionPermissions` и применяются ко всем зависимым полям (цена груза,
 * адреса точек), а не проверяются заново в каждом виджете.
 * @param detail Ответ `GET /auctions/{auctionUuid}`.
 * @param vatMode Режим отображения цен — общий стор, а не параметр страницы.
 * @returns ViewModel для всех секций детальной страницы.
 */
export const mapAuctionDetail = (
  detail: AuctionShowResponseDto,
  vatMode: VatMode,
): AuctionDetailVm => {
  const permissions = mapAuctionPermissions(detail);
  const assembly =
    emptyToNull(detail.assembly.num) === null && emptyToNull(detail.assembly.date) === null
      ? null
      : {
          num: text(detail.assembly.num),
          date: formatDateRange(detail.assembly.date, null),
        };

  return {
    orderUid: text(detail.main.order_uid),
    cargoNum: text(detail.main.cargo_num),
    aucType: getEnumEntry(AUCTION_TYPE_DICT, detail.main.auc_type),
    createdAt: formatDateRange(detail.main.created_at, null),
    organizer: {
      name: text(detail.organizer.organization_name),
      inn: text(detail.organizer.organization_inn),
    },
    contacts: detail.contacts.map((contact) => ({
      name: text(contact.name),
      phone: text(contact.phone),
      email: text(contact.email),
    })),
    route: mapRoute(detail.routes, permissions.hidePointsAddressAndContacts),
    cargo: mapCargo(detail, permissions.noViewCargoPrice),
    payment: mapPayment(detail.payment),
    assembly,
    admittedOrganizations: detail.admitted_organizations.map((organization) => ({
      name: text(organization.name),
      inn: text(organization.inn),
      isMain: organization.is_main === true,
    })),
    trading: mapTrading(detail, vatMode),
    permissions,
  };
};
