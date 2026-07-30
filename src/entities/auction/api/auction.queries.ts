import { queryOptions } from '@tanstack/react-query';

import { type AuctionListRequestDto } from '@/shared/api/dto';
import { auctionKeys } from '@/shared/api/query-keys';

import { getAuction, postAuctionsList } from './auction.api';

/**
 * Опции запроса списка аукционов.
 *
 * Фабрика `queryOptions`, а не инлайновый `useQuery`: у одного и того же
 * запроса четыре потребителя — компонент страницы, prefetch по hover,
 * инвалидация после ставки и (для detail) loader маршрута. Инлайновый вызов
 * означал бы четыре копии ключа и `queryFn`, которые разъедутся.
 *
 * `placeholderData: keepPreviousData` не задаётся здесь: он нужен только на
 * странице списка при пагинации и добавляется в её хуке.
 * @param request Тело запроса, собранное из search params.
 * @returns Опции для `useQuery` / `prefetchQuery`.
 */
export const auctionsListQueryOptions = (request: AuctionListRequestDto) =>
  queryOptions({
    queryKey: auctionKeys.list(request),
    queryFn: ({ signal }) => postAuctionsList(request, signal),
  });

/**
 * Опции запроса детальной информации.
 *
 * Используется и страницей, и loader'ом маршрута через `ensureQueryData`, и
 * prefetch'ем по hover — тем самым, который кладёт в кэш шаг ставки для
 * карточки списка (㉑).
 * @param auctionUuid `order_uid` аукциона.
 * @returns Опции для `useQuery` / `ensureQueryData` / `prefetchQuery`.
 */
export const auctionDetailQueryOptions = (auctionUuid: string) =>
  queryOptions({
    queryKey: auctionKeys.detail(auctionUuid),
    queryFn: ({ signal }) => getAuction(auctionUuid, signal),
  });
