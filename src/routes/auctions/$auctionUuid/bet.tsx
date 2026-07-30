import { createFileRoute } from '@tanstack/react-router';

import { auctionDetailQueryOptions } from '@/entities/auction';
import { loadOrNotFound } from '@/shared/lib/router/load-or-not-found.util';
import { ApiErrorState, EmptyState } from '@/shared/ui';

/**
 * `/auctions/$auctionUuid/bet` — установка ставки.
 *
 * Самостоятельный маршрут, а не состояние детальной страницы: задание требует,
 * чтобы режим установки ставки открывался **по ссылке**. На мобильных это
 * полноэкранная форма, на десктопе — модалка поверх детальной (фаза 8).
 *
 * Доступность формы определяется `trading.can_set_bet` (⑧), поэтому detail
 * нужен до рендера — его и греет loader.
 */
export const Route = createFileRoute('/auctions/$auctionUuid/bet')({
  loader: async ({ context, params }) =>
    loadOrNotFound(async () =>
      context.queryClient.ensureQueryData(auctionDetailQueryOptions(params.auctionUuid)),
    ),
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  component: function PlaceBetRoute() {
    const auction = Route.useLoaderData();

    return auction.trading.can_set_bet === true ? (
      <EmptyState title="Ставка" message="Форма ставки — фаза 8." />
    ) : (
      <EmptyState
        title="Ставка недоступна"
        message="По этому аукциону ставки сейчас не принимаются."
      />
    );
  },
});
