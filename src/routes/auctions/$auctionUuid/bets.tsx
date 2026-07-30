import { createFileRoute } from '@tanstack/react-router';

import { auctionDetailQueryOptions } from '@/entities/auction';
import { auctionBetsQueryOptions } from '@/entities/bet';
import { loadOrNotFound } from '@/shared/lib/router/load-or-not-found.util';
import { ApiErrorState, EmptyState } from '@/shared/ui';

/**
 * `/auctions/$auctionUuid/bets` — история ставок.
 *
 * Loader греет и detail, и сами ставки: скрытость истории — решение по данным
 * detail (⑩⑪), у `GET /bets` серверного кода на этот случай нет. Параметр
 * `all: true` по умолчанию — иначе отменённые ставки не придут, и требуемые
 * заданием «признак отменённой ставки» и «причина отмены» показать будет нечем (㉙).
 */
export const Route = createFileRoute('/auctions/$auctionUuid/bets')({
  loader: async ({ context, params }) => {
    const detail = await loadOrNotFound(async () =>
      context.queryClient.ensureQueryData(auctionDetailQueryOptions(params.auctionUuid)),
    );
    const hidden = detail.hide_bets_history === true || detail.trading.hide_bets_history === true;

    if (hidden) return { hidden: true as const };

    await context.queryClient.ensureQueryData(
      auctionBetsQueryOptions({ auctionUuid: params.auctionUuid, all: true }),
    );

    return { hidden: false as const };
  },
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  component: function AuctionBetsRoute() {
    const { hidden } = Route.useLoaderData();

    return hidden ? (
      <EmptyState
        title="История ставок скрыта"
        message="Организатор скрыл историю ставок по этому аукциону."
      />
    ) : (
      <EmptyState title="Ставки" message="Данные загружены. Таблица ставок — фаза 7." />
    );
  },
});
