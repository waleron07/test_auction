import { createFileRoute } from '@tanstack/react-router';

import { auctionDetailQueryOptions } from '@/entities/auction';
import { loadOrNotFound } from '@/shared/lib/router/load-or-not-found.util';
import { ApiErrorState, EmptyState, NotFound } from '@/shared/ui';

/**
 * `/auctions/$auctionUuid` — детальная страница.
 *
 * `$auctionUuid` — это `main.order_uid`, а не `main.id` (⑱).
 *
 * `loader` через `ensureQueryData` греет тот же ключ, который читает страница и
 * который prefetch по hover уже мог заполнить: переход по ссылке из списка не
 * порождает второй запрос. 404 — ожидаемое состояние контракта, а не сбой,
 * поэтому у маршрута есть свой `notFoundComponent`.
 */
export const Route = createFileRoute('/auctions/$auctionUuid/')({
  loader: async ({ context, params }) =>
    // 404 контракта — ожидаемое состояние, а не сбой: он уходит в
    // notFoundComponent, где есть дорога назад к списку (⑪).
    loadOrNotFound(async () =>
      context.queryClient.ensureQueryData(auctionDetailQueryOptions(params.auctionUuid)),
    ),
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  notFoundComponent: () => <NotFound message="Аукцион не найден или снят с торгов." />,
  component: function AuctionDetailRoute() {
    const auction = Route.useLoaderData();

    return (
      <EmptyState
        title={`Аукцион ${auction.main.cargo_num ?? ''}`}
        message="Данные загружены loader'ом. Разделы маршрута, груза и торгов — фаза 6."
      />
    );
  },
});
