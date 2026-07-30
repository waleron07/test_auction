import { type AuctionListItemDto, type AuctionShowResponseDto } from '@/shared/api/dto';

/**
 * Требования к ТС в форме проекции списка. Тип выводится из DTO списка, а не
 * добавляется алиасом в `shared/api/dto.ts`: вложенные подсхемы наружу не
 * выходят, а моки — единственный их потребитель.
 */
type ListCargoCar = NonNullable<NonNullable<AuctionListItemDto['cargo']>['car']>;

/**
 * Поля, которые существуют **только** в проекции списка.
 *
 * Список и detail — две разные проекции одной сущности, и состав полей у них не
 * совпадает (㉑㉒㉓㉖). Всё, что есть в detail, канонический объект хранит один
 * раз в `detail`; здесь лежит остаток, которому в detail места нет.
 *
 * Выводимое сюда не попадает: `is_assembly` считается из `assembly`,
 * `direction` — из городов маршрута, `points_count` — из самих точек. Хранить
 * их значило бы завести второй источник правды внутри объекта, который создан
 * ровно затем, чтобы источник был один.
 */
export interface AuctionListOnlyFields {
  /** `main.priority_sort` — в detail отсутствует. */
  prioritySort: number;
  /** `organizer.is_hide_organization`: у `AuctionShowOrganizer` флага нет (㉖). */
  isHideOrganization: boolean;
  /** `trading.comment` — комментарий к торгам, только в списке. */
  comment: string;
  /** `trading.is_available` — фильтр `is_available` работает по нему. */
  isAvailable: boolean;
  /** `trading.is_accredited` — только в списке. */
  isAccredited: boolean;
  /** Название груза: в `AuctionShowCargo` его нет (㉔). */
  cargoName: string;
  /** Суммарный вес, т. В detail вес живёт по точкам маршрута строками (㉕). */
  cargoWeight: number;
  /** Суммарный объём, м³. */
  cargoVolume: number;
  /** `cargo.incoterms` — только в списке. */
  incoterms: string;
  /** `cargo.is_cargo` — только в списке. */
  isCargo: boolean;
  /** Требования к ТС в форме списка: у detail та же сущность, но nullable-поля. */
  car: ListCargoCar | null;
  /** Свёрнутая точка погрузки для карточки. */
  load: AuctionRoutePointSummary;
  /** Свёрнутая точка выгрузки для карточки. */
  unload: AuctionRoutePointSummary;
  /** `payment.consignor` — только в списке. */
  consignor: string;
  /** `payment.consignee` — только в списке. */
  consignee: string;
  /**
   * Отдать в списке `trading.price: null` (㉛).
   *
   * В списке оба объекта — `price` и `your` — объявлены nullable, то есть у
   * карточки может не быть блока цены вовсе. В detail такого нет, поэтому
   * случай моделируется флагом, а не отсутствием данных.
   */
  nullPriceInList: boolean;
  /** Отдать в списке `trading.your: null` (㉛). */
  nullYourInList: boolean;
  /**
   * Отдать в списке `bid_measurement_type: null`.
   *
   * Ещё одна асимметрия проекций: в списке поле nullable, в detail — нет.
   * Значит «единица не задана» выразима только в списке, и случай ㉚ с `null`
   * моделируется флагом.
   */
  nullBidMeasurementInList: boolean;
}

/** Свёрнутое представление точки маршрута для карточки списка. */
export interface AuctionRoutePointSummary {
  /** Город. */
  city: string;
  /** Адрес: скрывается флагом `hide_points_address_and_contacts` (㉗). */
  address: string;
  /** Дата операции, naive-время (⑮). */
  date: string;
  /** Идентификатор города в классификаторе. */
  cityGcId: number;
}

/**
 * Каноническая сущность аукциона в сторе MSW.
 *
 * Хранится **одна** сущность на аукцион, а обе проекции собираются из неё
 * мапперами `toShowResponse` / `toListItem`. Иначе асимметрия DTO (6 значений
 * `status_mobile` против 9, `your` из двух полей против четырёх, отсутствие
 * `step` в списке) расползлась бы по хендлерам, и две проекции разъехались бы
 * после первой же мутации — риск, отдельно отмеченный в плане.
 */
export interface AuctionEntity {
  /** Полная проекция detail: она надмножество, поэтому и служит источником. */
  detail: AuctionShowResponseDto;
  /** Остаток, существующий только в списке. */
  listOnly: AuctionListOnlyFields;
}
