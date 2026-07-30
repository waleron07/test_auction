import { type BadgeColor } from '@/shared/lib/enums/enum-dict.types';

import { type AuctionPermissions } from '../lib/map-auction-permissions.util';

/** Значение enum, подготовленное к рендеру: лейбл и цвет бейджа. */
export interface BadgeVm {
  label: string;
  color: BadgeColor;
}

/** Груз в карточке списка. Все поля — строки: прочерк вместо пустоты (⑫). */
export interface AuctionCargoVm {
  name: string;
  weight: string;
  volume: string;
  bodyType: string;
}

/**
 * ViewModel карточки списка.
 *
 * Ни одного опционального поля: компонент не решает, что делать с `undefined`,
 * — это работа маппера (㉜). Цены и даты уже отформатированы, потому что
 * формат зависит от единицы измерения (㉚) и от того, один ли это день, и
 * размазывать такие решения по разметке нельзя.
 */
export interface AuctionCardVm {
  orderUid: string;
  cargoNum: string;
  aucType: BadgeVm;
  status: BadgeVm;
  tradingStatus: BadgeVm;
  organizer: string;
  route: string;
  loadDate: string;
  unloadDate: string;
  cargo: AuctionCargoVm;
  /** Текущая цена с единицей измерения либо прочерк, если блока цены нет (㉛). */
  price: string;
  /** Цена за километр либо прочерк. */
  pricePerKm: string;
  /** Есть ли моя ставка. `trading.your === null` трактуется как «нет» (㉛). */
  hasMyBet: boolean;
}

/** Контакт организатора: все поля схемы nullable (Contact). */
export interface ContactVm {
  name: string;
  phone: string;
  email: string;
}

/** Организатор аукциона. */
export interface OrganizerVm {
  name: string;
  inn: string;
}

/** Точка маршрута — погрузка, выгрузка или промежуточная. */
export interface RoutePointVm {
  operation: BadgeVm;
  city: string;
  /** «Скрыто организатором», если действует `hidePointsAddressAndContacts` (㉗). */
  address: string;
  date: string;
  contactName: string;
  contactPhone: string;
}

/** Требования к транспортному средству. `null`, если требований нет вовсе. */
export interface CarRequirementsVm {
  type: string;
  weight: string;
  volume: string;
  /** «13.6 × 2.45 × 2.7 м» либо прочерк, если хотя бы один размер не задан. */
  dimensions: string;
}

/** Груз аукциона: сведения из `AuctionShowCargo` плюс требования к ТС. */
export interface AuctionCargoDetailVm {
  /** Собрано из `routes[].cargo.name` (㉔): detail не содержит названия груза сам. */
  name: string;
  /** «Скрыто организатором», если действует `noViewCargoPrice`. */
  price: string;
  bodyType: string;
  truckCount: number;
  /** «1500 км» либо прочерк. */
  distance: string;
  /** Подписи включённых типов загрузки — side/top/rear/full как чипы. */
  loadingTypes: string[];
  /** Подписи требуемых документов — tir/cmr/t1/med как чипы. */
  docs: string[];
  car: CarRequirementsVm | null;
}

/** Условия оплаты. */
export interface AuctionPaymentVm {
  form: string;
  condition: string;
  /** «30 календарных дней» либо прочерк, если отсрочки нет. */
  delay: string;
  prepay: string;
}

/** Сборка — она есть не у каждого аукциона. */
export interface AssemblyVm {
  num: string;
  date: string;
}

/** Организация, допущенная к торгам. */
export interface AdmittedOrganizationVm {
  name: string;
  inn: string;
  isMain: boolean;
}

/**
 * Цена, выбранная по режиму НДС.
 *
 * `isFallback` — та же пометка, что и в `SelectedPrice`: показано базовое
 * значение вместо запрошенного «без НДС», потому что близнеца нет. На detail
 * это практически не должно случаться — все шесть пар полны, — но защита
 * остаётся: тотализация не должна зависеть от того, насколько полны сегодняшние
 * тестовые данные.
 */
export interface PriceFieldVm {
  text: string;
  isFallback: boolean;
}

/** Параметры торгов и своя ставка. */
export interface AuctionTradingVm {
  status: BadgeVm;
  startDate: string;
  stopDate: string;
  current: PriceFieldVm;
  available: PriceFieldVm;
  min: PriceFieldVm;
  max: PriceFieldVm;
  step: PriceFieldVm;
  pricePerKm: string;
  allowCounterBets: boolean;
  hasMyBet: boolean;
  myBet: PriceFieldVm;
  isWinner: boolean;
  /** Продление торгов после ставки, мин. `null`, если не задано. */
  prolongAfterBetMinutes: number | null;
}

/**
 * ViewModel детальной страницы.
 *
 * Как и `AuctionCardVm`, не содержит опциональных полей и готовых к рендеру
 * строк вместо сырых значений DTO (㉜). `permissions` не пересчитывается
 * отдельно виджетами — они читают то, что уже посчитал `mapAuctionDetail`.
 */
export interface AuctionDetailVm {
  orderUid: string;
  cargoNum: string;
  aucType: BadgeVm;
  createdAt: string;
  organizer: OrganizerVm;
  /** Пустой массив, если организатор не оставил контактов — не флаг, а данные. */
  contacts: ContactVm[];
  route: RoutePointVm[];
  cargo: AuctionCargoDetailVm;
  payment: AuctionPaymentVm;
  assembly: AssemblyVm | null;
  admittedOrganizations: AdmittedOrganizationVm[];
  trading: AuctionTradingVm;
  permissions: AuctionPermissions;
}
