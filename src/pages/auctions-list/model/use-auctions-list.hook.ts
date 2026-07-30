import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { auctionsListQueryOptions } from '@/entities/auction';
import { buildAuctionListRequest } from '@/features/filter-auctions/lib/build-auction-list-request.util';
import { type AuctionSearch } from '@/features/filter-auctions/model/auction-search.schema';

/**
 * Данные страницы списка.
 *
 * `keepPreviousData` — не украшательство: без него смена страницы или фильтра
 * заменяет карточки скелетоном, страница схлопывается и прыгает вверх. С ним
 * предыдущая выдача остаётся на месте до прихода новой (5.1).
 *
 * Тело запроса собирается request builder'ом и целиком входит в ключ, поэтому
 * `useMemo` здесь по делу: новый объект на каждый рендер означал бы новый ключ
 * и бесконечный цикл запросов.
 * @param search Разобранное состояние фильтров.
 * @returns Результат запроса списка.
 */
export const useAuctionsList = (search: AuctionSearch) => {
  const request = useMemo(() => buildAuctionListRequest(search), [search]);

  return useQuery({
    ...auctionsListQueryOptions(request),
    placeholderData: keepPreviousData,
  });
};
