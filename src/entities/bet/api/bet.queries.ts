import { queryOptions } from '@tanstack/react-query';

import { auctionKeys } from '@/shared/api/query-keys';

import { getAuctionBets } from './bet.api';

export interface AuctionBetsQueryParams {
  /** `order_uid` аукциона. */
  auctionUuid: string;
  /** Показывать отменённые ставки (㉙). Входит и в ключ, и в query-параметр. */
  all: boolean;
}

/**
 * Опции запроса истории ставок.
 *
 * `enabled` здесь не задаётся: скрытость истории (`hide_bets_history`) —
 * решение по данным detail, у `GET /bets` серверного кода на этот случай нет
 * (⑪). Флаг подставляет хук страницы ставок, чтобы не дёргать эндпоинт зря.
 * @param params Идентификатор аукциона и признак `all`.
 * @returns Опции для `useQuery` / `ensureQueryData`.
 */
export const auctionBetsQueryOptions = ({ auctionUuid, all }: AuctionBetsQueryParams) =>
  queryOptions({
    queryKey: auctionKeys.bets(auctionUuid, { all }),
    queryFn: ({ signal }) => getAuctionBets({ auctionUuid, all }, signal),
  });
