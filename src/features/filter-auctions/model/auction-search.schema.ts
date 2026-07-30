import { z } from 'zod';

import {
  type AuctionStatusDto,
  type AuctionTypeDto,
  type TradingStatusDto,
} from '@/shared/api/dto';

/** Размер страницы по умолчанию. */
export const DEFAULT_PER_PAGE = 20;

/**
 * Максимальный размер страницы.
 *
 * Числа в схеме нет, но пример ошибки 422 у `POST /auctions/list` намекает на
 * ограничение сверху. Клампим на клиенте: `?per_page=99999` должен открыть
 * страницу, а не показать ошибку сервера.
 */
export const MAX_PER_PAGE = 100;

/**
 * Формат дат фильтров — `pattern` из схемы, скопированный дословно (⑮).
 * Ответы приходят без смещения, а фильтры обязаны быть **со** смещением.
 */
const API_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)$/;

/** Торговые статусы пользователя: все девять значений (③). */
export const TRADING_STATUSES = [
  'NotParticipating',
  'Leading',
  'Losing',
  'OnPending',
  'Confirmed',
  'ChoosingWinner',
  'Winner',
  'Accepted',
  'Unknown',
] as const satisfies readonly NonNullable<TradingStatusDto>[];

/** Статусы аукциона, кодируемые для фильтра `statuses`: без `Unknown` (②). */
export const AUCTION_STATUSES = [
  'Planning',
  'Auction',
  'DeterminateWinner',
  'WaitDeal',
  'InProgress',
  'Finished',
  'Stopped',
  'Canceled',
] as const satisfies readonly NonNullable<AuctionStatusDto>[];

/** Типы аукциона, доступные фильтру: `Unknown` в его enum'е нет (③⑤). */
export const AUCTION_TYPES = [
  'Request',
  'Up',
  'Down',
  'FixPrice',
] as const satisfies readonly NonNullable<AuctionTypeDto>[];

/**
 * Массив enum-значений из URL.
 *
 * Три отдельные проблемы решаются здесь, а не в компонентах: одиночное значение
 * (`?auc_type=Down`) приводится к массиву; незнакомые значения **отбрасываются**,
 * а не роняют разбор — иначе чужая ссылка со старым значением статуса ломала бы
 * страницу; пустой результат превращается в «фильтра нет».
 * @param values Допустимые значения enum'а.
 * @returns Схема, всегда возвращающая массив известных значений.
 */
const enumArray = <const T extends readonly [string, ...string[]]>(values: T) =>
  z
    .unknown()
    .transform((raw): unknown[] => (Array.isArray(raw) ? (raw as unknown[]) : [raw]))
    .transform((items) =>
      items.filter((item): item is T[number] => values.includes(item as T[number])),
    )
    .catch([]);

/** Непустая строка; пробелы и пустая строка означают «фильтра нет». */
const filterString = z
  .unknown()
  .transform((raw) => (typeof raw === 'string' ? raw.trim() : undefined))
  .transform((value) => (value === undefined || value === '' ? undefined : value))
  .catch(undefined);

/** Неотрицательное число из строки или числа; всё прочее — «фильтра нет». */
const filterNumber = z
  .unknown()
  .transform((raw) => {
    const parsed = typeof raw === 'number' ? raw : Number(raw);

    return typeof raw === 'boolean' || !Number.isFinite(parsed) || parsed < 0 ? undefined : parsed;
  })
  .catch(undefined);

/** Булев фильтр: принимает и строковую форму, которую даёт URL. */
const filterBoolean = z
  .unknown()
  .transform((raw) => {
    if (typeof raw === 'boolean') return raw;

    if (raw === 'true') return true;

    if (raw === 'false') return false;

    return undefined;
  })
  .catch(undefined);

/** Дата фильтра: только формат контракта, всё остальное — «фильтра нет» (⑮). */
const filterDate = z
  .unknown()
  .transform((raw) => (typeof raw === 'string' && API_DATE_TIME.test(raw) ? raw : undefined))
  .catch(undefined);

/**
 * Схема search params страницы списка.
 *
 * `.catch()` стоит на каждом поле: URL — чужой ввод, и `?page=abc&status=МУСОР`
 * обязан открыть список с дефолтами, а не белый экран. Это отдельное требование
 * задания, и оно же причина, по которой фильтры живут в URL, а не в localStorage:
 * ссылку с фильтрами можно прислать коллеге, и она не должна ронять приложение.
 */
export const auctionSearchSchema = z.object({
  page: z
    .unknown()
    .transform((raw) => {
      const parsed = Math.floor(Number(raw));

      return Number.isFinite(parsed) && parsed >= 1 ? parsed : 1;
    })
    .catch(1),
  perPage: z
    .unknown()
    .transform((raw) => {
      const parsed = Math.floor(Number(raw));

      if (!Number.isFinite(parsed)) return DEFAULT_PER_PAGE;

      return Math.min(Math.max(parsed, 1), MAX_PER_PAGE);
    })
    .catch(DEFAULT_PER_PAGE),
  cargoNum: filterString,
  status: enumArray(TRADING_STATUSES),
  statuses: enumArray(AUCTION_STATUSES),
  aucType: enumArray(AUCTION_TYPES),
  loadCity: filterString,
  unloadCity: filterString,
  loadDateFrom: filterDate,
  loadDateTo: filterDate,
  isAvailable: filterBoolean,
  isBidder: filterBoolean,
  priceFrom: filterNumber,
  priceTo: filterNumber,
  sort: z
    .unknown()
    .transform((raw) => (raw === 'oldest' ? ('oldest' as const) : undefined))
    .catch(undefined),
});

/** Разобранное состояние фильтров страницы списка. */
export type AuctionSearch = z.output<typeof auctionSearchSchema>;

/** Ключи, которые считаются фильтрами: пагинация и сортировка сюда не входят. */
export type AuctionFilterKey = Exclude<keyof AuctionSearch, 'page' | 'perPage' | 'sort'>;

/**
 * Пустое состояние всех фильтров.
 *
 * Один источник правды для двух операций, которые обязаны знать одинаковый
 * список полей: сброса фильтров и подсчёта активных. Раньше перечень жил в
 * трёх местах, и забытое поле не ловилось ни компилятором, ни тестом — оно
 * просто переставало сбрасываться или переставало учитываться в бейдже.
 *
 * `satisfies` по всем ключам делает пропуск ошибкой компиляции, но сохраняет
 * точные типы значений — иначе `status: []` перестал бы подходить фильтру.
 */
export const EMPTY_FILTERS = {
  cargoNum: undefined,
  status: [],
  statuses: [],
  aucType: [],
  loadCity: undefined,
  unloadCity: undefined,
  loadDateFrom: undefined,
  loadDateTo: undefined,
  isAvailable: undefined,
  isBidder: undefined,
  priceFrom: undefined,
  priceTo: undefined,
} satisfies { [K in AuctionFilterKey]: AuctionSearch[K] };
