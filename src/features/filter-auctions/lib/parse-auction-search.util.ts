import { type AuctionSearch, auctionSearchSchema } from '../model/auction-search.schema';

/** Соответствие «ключ в URL → поле состояния»: в URL snake_case, в коде camelCase. */
const URL_KEYS = {
  page: 'page',
  per_page: 'perPage',
  cargo_num: 'cargoNum',
  status: 'status',
  statuses: 'statuses',
  auc_type: 'aucType',
  load_city: 'loadCity',
  unload_city: 'unloadCity',
  load_date_from: 'loadDateFrom',
  load_date_to: 'loadDateTo',
  is_available: 'isAvailable',
  is_bidder: 'isBidder',
  price_from: 'priceFrom',
  price_to: 'priceTo',
  sort: 'sort',
} as const satisfies Record<string, keyof AuctionSearch>;

/**
 * Разбирает search params страницы списка. Никогда не бросает.
 *
 * Ключи URL остаются snake_case — ссылка читается человеком и совпадает по
 * написанию с полями контракта, — а состояние внутри приложения camelCase.
 * Переименование живёт здесь, в одном месте: иначе каждый компонент знал бы про
 * обе формы записи.
 *
 * Функция чистая и тестируется отдельно от роутера: `validateSearch` маршрута —
 * тонкая обёртка над ней, а вся логика «что делать с мусором в URL» проверяется
 * без монтирования приложения.
 * @param raw Сырые параметры из URL — что угодно, включая `null` и не-объект.
 * @returns Состояние фильтров с безопасными значениями по умолчанию.
 */
export const parseAuctionSearch = (raw: unknown): AuctionSearch => {
  const source = typeof raw === 'object' && raw !== null ? (raw as Record<string, unknown>) : {};
  const renamed: Record<string, unknown> = {};

  for (const [urlKey, stateKey] of Object.entries(URL_KEYS)) {
    // Значение может лежать под любым из двух написаний: под тем, что пришло из
    // адресной строки, и под тем, что роутер вернул после собственной записи.
    renamed[stateKey] = source[urlKey] ?? source[stateKey];
  }

  return auctionSearchSchema.parse(renamed);
};
