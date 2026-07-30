import { createFileRoute } from '@tanstack/react-router';

import { auctionDetailQueryOptions, mapAuctionPermissions } from '@/entities/auction';
import { PlaceBetPage } from '@/pages/place-bet';
import { loadOrNotFound } from '@/shared/lib/router/load-or-not-found.util';
import { ApiErrorState, EmptyState, RouterButton } from '@/shared/ui';

/**
 * `/auctions/$auctionUuid/bet` — установка ставки.
 *
 * Самостоятельный маршрут, а не состояние детальной страницы: задание требует,
 * чтобы режим установки ставки открывался **по ссылке**. На мобильных это
 * полноэкранная форма, на десктопе — модалка поверх детальной (8.1, 0.7).
 *
 * Доступность формы определяется `permissions.canSetBet` (⑧), поэтому detail
 * нужен до рендера — его и греет loader. Проверка та же самая, что уже
 * применяется на детальной и на ставках (`mapAuctionPermissions`), а не
 * повторное чтение `trading.can_set_bet` вручную — решение о доступе живёт в
 * одном месте (найдено при переносе флагов в фазе 6). Та же проверка
 * продублирована в MSW-handler (422): фронтовая — не единственная линия
 * обороны (8.1).
 */
export const Route = createFileRoute('/auctions/$auctionUuid/bet')({
  loader: async ({ context, params }) =>
    loadOrNotFound(async () =>
      context.queryClient.ensureQueryData(auctionDetailQueryOptions(params.auctionUuid)),
    ),
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  component: function PlaceBetRoute() {
    const { auctionUuid } = Route.useParams();
    const auction = Route.useLoaderData();

    if (!mapAuctionPermissions(auction).canSetBet) {
      return (
        <EmptyState
          title="Ставка недоступна"
          message="По этому аукциону ставки сейчас не принимаются."
          action={
            <RouterButton to="/auctions/$auctionUuid" params={{ auctionUuid }} variant="outlined">
              Назад к аукциону
            </RouterButton>
          }
        />
      );
    }

    return <PlaceBetPage auctionUuid={auctionUuid} />;
  },
});
