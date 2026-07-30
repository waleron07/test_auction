import { type components } from './generated/schema';

/**
 * Единственное место в проекте, где встречается `components['schemas'][...]`.
 *
 * Сгенерированный `schema.ts` — деталь реализации слоя `shared/api`: он
 * пересоздаётся целиком командой `npm run generate`, и его форма зависит от
 * версии `openapi-typescript`. Код ходит по коротким алиасам, а импорт
 * `generated/**` вне `shared/api` запрещён линтером.
 *
 * Рукописных DTO в проекте нет ни одного: источник правды — схема.
 */

/* --- Запросы и ответы операций --- */

/** Тело `POST /auctions/list`. */
export type AuctionListRequestDto = components['schemas']['AuctionListRequest'];
/** Ответ `POST /auctions/list`: `{ data, meta }` (⑥). */
export type AuctionListResponseDto = components['schemas']['AuctionListResponseBase'];
/** Пагинация ответа списка: `last_page` берём из неё, а не вычисляем (⑥). */
export type AuctionListMetaDto = components['schemas']['AuctionListMeta'];
/** Элемент списка. Проекция отличается от detail составом полей (㉑㉒㉓). */
export type AuctionListItemDto = components['schemas']['AuctionListItem'];
/** Ответ `GET /auctions/{auctionUuid}`. Единственная схема с 9 `required` (㉜). */
export type AuctionShowResponseDto = components['schemas']['AuctionShowResponse'];
/** Ответ `GET /auctions/{auctionUuid}/bets`: `{ bets }`, счётчика участников нет (⑬). */
export type BetListResponseDto = components['schemas']['BetListResponse'];
/** Элемент истории ставок. */
export type BetItemDto = components['schemas']['BetItem'];
/** Тело `POST /auctions/{auctionUuid}/bets`: единственное поле `price` (⑧). */
export type SetBetRequestDto = components['schemas']['SetBetRequest'];

/* --- Ошибки (⑯) --- */

/** 401 / 404 / 503. */
export type ProblemDetailDto = components['schemas']['ProblemDetail'];
/** 422: то же плюс `errors[]`. */
export type ValidationProblemDto = components['schemas']['ValidationProblem'];
/** Одна ошибка валидации: `field` — snake_case-путь с точками. */
export type ValidationErrorDto = components['schemas']['ValidationError'];

/* --- Enum'ы контракта --- */

/** Тип аукциона. В фильтре `auc_type` — без `Unknown` (③). */
export type AuctionTypeDto = components['schemas']['AuctionType'];
/** Статус аукциона: 9 значений, в фильтр уходят числовые коды 1–8 (②). */
export type AuctionStatusDto = components['schemas']['AuctionStatus'];
/** Торговый статус пользователя: 9 значений против 6 в `status_mobile` (③). */
export type TradingStatusDto = components['schemas']['TradingStatus'];
/** Единица измерения ставки: меняет смысл цены (㉚). */
export type BidMeasurementTypeDto = components['schemas']['BidMeasurementType'];
/** Тип операции на точке маршрута. */
export type OperationTypeDto = components['schemas']['OperationType'];
/** Тип отсрочки платежа. В схеме допускает `null`. */
export type PaymentDelayTypeDto = components['schemas']['PaymentDelayType'];
