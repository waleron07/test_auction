import { createFileRoute } from '@tanstack/react-router';

import { auctionDetailQueryOptions, mapAuctionPermissions } from '@/entities/auction';
import { auctionBetsQueryOptions } from '@/entities/bet';
import { AuctionBetsPage } from '@/pages/auction-bets/ui/auction-bets-page.component';
import { loadOrNotFound } from '@/shared/lib/router/load-or-not-found.util';
import { ApiErrorState } from '@/shared/ui';

/**
 * `/auctions/$auctionUuid/bets` — история ставок.
 *
 * Loader греет и detail, и сами ставки: скрытость истории — решение по данным
 * detail (⑩⑪), у `GET /bets` серверного кода на этот случай нет. Параметр
 * `all: true` по умолчанию — иначе отменённые ставки не придут, и требуемые
 * заданием «признак отменённой ставки» и «причина отмены» показать будет нечем (㉙).
 * Компонент страницы читает те же ключи повторно через `useAuctionBets` —
 * `ensureQueryData` здесь только греет кэш, переключатель «Показывать
 * отменённые» уже работает поверх обычного `useQuery` в хуке страницы.
 */
export const Route = createFileRoute('/auctions/$auctionUuid/bets')({
  loader: async ({ context, params }) => {
    const detail = await loadOrNotFound(async () =>
      context.queryClient.ensureQueryData(auctionDetailQueryOptions(params.auctionUuid)),
    );

    if (mapAuctionPermissions(detail).hideBetsHistory) return;

    await context.queryClient.ensureQueryData(
      auctionBetsQueryOptions({ auctionUuid: params.auctionUuid, all: true }),
    );
  },
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  component: function AuctionBetsRoute() {
    const { auctionUuid } = Route.useParams();

    return <AuctionBetsPage auctionUuid={auctionUuid} />;
  },
});
