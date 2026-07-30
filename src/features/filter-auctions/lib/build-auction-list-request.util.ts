import { type AuctionListRequestDto } from '@/shared/api/dto';
import { CITIES } from '@/shared/config/cities';
import { AUCTION_STATUS_CODE } from '@/shared/lib/enums/auction-status.dict';

import { type AuctionSearch } from '../model/auction-search.schema';

/**
 * Идентификатор города из словаря по названию (⑲).
 * @param name Название города из фильтра.
 * @returns `gc_id` либо `undefined`, если города нет в словаре.
 */
const findCityGcId = (name: string): number | undefined =>
  CITIES.find((city) => city.name.toLowerCase() === name.toLowerCase())?.gcId;

/**
 * Собирает тело `POST /auctions/list` из состояния фильтров.
 *
 * Три вещи, которые здесь важнее удобства:
 *
 * 1. **`status` и `statuses` — разные сущности** (①). Первый фильтрует торговый
 *    статус пользователя строками, второй — статус аукциона числовыми кодами
 *    через `AUCTION_STATUS_CODE` (②). Перепутать их значит молча вернуть не то.
 *    `mobile_statuses` не отправляется вовсе: он дубль `status`.
 * 2. **Пустые и дефолтные поля не попадают в тело.** Тело целиком входит в ключ
 *    запроса TanStack Query, поэтому лишний `undefined` или пустой массив — это
 *    другой ключ, промах мимо прогретого prefetch'ем кэша и лишний запрос.
 * 3. **Порядок ключей фиксирован кодом**, а не порядком полей в URL: два
 *    одинаковых состояния обязаны давать посимвольно одинаковый ключ.
 * @param search Разобранное состояние фильтров.
 * @returns Тело запроса списка.
 */
export const buildAuctionListRequest = (search: AuctionSearch): AuctionListRequestDto => {
  const request: AuctionListRequestDto = {
    page: search.page,
    per_page: search.perPage,
  };

  if (search.cargoNum !== undefined) request.cargo_num = search.cargoNum;

  if (search.status.length > 0) request.status = search.status;

  if (search.statuses.length > 0) {
    request.statuses = search.statuses.map((status) => AUCTION_STATUS_CODE[status]);
  }

  if (search.aucType.length > 0) request.auc_type = search.aucType;

  if (search.loadCity !== undefined) {
    request.load_city = search.loadCity;

    const gcId = findCityGcId(search.loadCity);

    // Город не из словаря уходит строкой: сервер умеет искать по названию,
    // и терять введённое пользователем значение из-за отсутствия в мок-словаре
    // было бы хуже, чем отправить фильтр без gc_id.
    if (gcId !== undefined) request.load_gc_id = gcId;
  }

  if (search.unloadCity !== undefined) {
    request.unload_city = search.unloadCity;

    const gcId = findCityGcId(search.unloadCity);

    if (gcId !== undefined) request.unload_gc_id = gcId;
  }

  // Даты уже прошли `pattern` схемы при разборе URL (⑮): здесь они уходят как есть.
  if (search.loadDateFrom !== undefined) request.load_date_from = search.loadDateFrom;

  if (search.loadDateTo !== undefined) request.load_date_to = search.loadDateTo;

  // `false` означает «не фильтровать», а не «показать обратное»: обратного
  // значения у этих фильтров в контракте нет.
  if (search.isAvailable === true) request.is_available = true;

  if (search.isBidder === true) request.is_bidder = true;

  if (search.priceFrom !== undefined) request.current_price_from = search.priceFrom;

  if (search.priceTo !== undefined) request.current_price_to = search.priceTo;

  if (search.sort === 'oldest') request.is_oldest = true;

  return request;
};
