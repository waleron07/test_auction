import { type AuctionSearch } from '../model/auction-search.schema';

/**
 * Считает, сколько фильтров задано.
 *
 * Число показывается бейджем на кнопке «Фильтры» в мобильной вёрстке, где сама
 * панель скрыта в drawer: без бейджа пользователь не видит, что список
 * отфильтрован, и считает пустую выдачу поломкой.
 *
 * Два правила, которые делают счётчик честным: пагинация и сортировка
 * фильтрами не считаются (иначе бейдж горел бы на чистой второй странице), а
 * диапазон считается одним фильтром независимо от того, заданы обе границы или
 * одна — «цена от 100 до 200» это один критерий, а не два.
 * @param search Разобранное состояние фильтров.
 * @returns Количество активных фильтров.
 */
export const countActiveFilters = (search: AuctionSearch): number => {
  const filled = [
    search.cargoNum !== undefined,
    search.status.length > 0,
    search.statuses.length > 0,
    search.aucType.length > 0,
    search.loadCity !== undefined,
    search.unloadCity !== undefined,
    search.loadDateFrom !== undefined || search.loadDateTo !== undefined,
    search.isAvailable === true,
    search.isBidder === true,
    search.priceFrom !== undefined || search.priceTo !== undefined,
  ];

  return filled.filter(Boolean).length;
};
