import {
  type AuctionFilterKey,
  type AuctionSearch,
  EMPTY_FILTERS,
} from '../model/auction-search.schema';

/** Диапазоны: две границы — один фильтр. */
const RANGES: readonly (readonly [AuctionFilterKey, AuctionFilterKey])[] = [
  ['loadDateFrom', 'loadDateTo'],
  ['priceFrom', 'priceTo'],
];

/**
 * Значение фильтра задано: непустая строка, непустой массив или `true`.
 * @param value Значение одного фильтра.
 * @returns `true`, если фильтр задан.
 */
const isFilled = (value: AuctionSearch[AuctionFilterKey]): boolean => {
  if (value === undefined) return false;

  if (Array.isArray(value)) return value.length > 0;

  // `false` у переключателя означает «не фильтровать», а не обратный фильтр.
  return value !== false;
};

/**
 * Считает, сколько фильтров задано.
 *
 * Число показывается бейджем на кнопке «Фильтры» в мобильной вёрстке, где сама
 * панель скрыта в drawer: без бейджа пользователь не видит, что список
 * отфильтрован, и считает пустую выдачу поломкой.
 *
 * Перечень полей берётся из `EMPTY_FILTERS`, а не выписывается заново: раньше
 * список фильтров существовал в трёх местах, и забытая строка тихо гасила
 * бейдж. Пагинация и сортировка в этот перечень не входят — иначе бейдж горел
 * бы на чистой второй странице. Диапазон считается одним фильтром независимо
 * от того, заданы обе границы или одна: «цена от 100 до 200» — один критерий.
 * @param search Разобранное состояние фильтров.
 * @returns Количество активных фильтров.
 */
export const countActiveFilters = (search: AuctionSearch): number => {
  const rangeKeys = new Set(RANGES.flat());
  const ranges = RANGES.filter(([from, to]) => isFilled(search[from]) || isFilled(search[to]));
  const singles = (Object.keys(EMPTY_FILTERS) as AuctionFilterKey[]).filter(
    (key) => !rangeKeys.has(key) && isFilled(search[key]),
  );

  return ranges.length + singles.length;
};
