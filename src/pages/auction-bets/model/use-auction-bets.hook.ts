import { keepPreviousData, useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { auctionDetailQueryOptions, mapAuctionPermissions } from '@/entities/auction';
import { auctionBetsQueryOptions, countBetParticipants, mapBet } from '@/entities/bet';
import { useCurrentUserStore } from '@/shared/model/current-user.store';
import { useVatModeStore } from '@/shared/model/vat-mode.store';

/**
 * Данные и состояние страницы истории ставок.
 *
 * Detail читается через `useSuspenseQuery`: маршрут уже прогрел кэш в
 * `loader`, и `permissions.hideBetsHistory` нужен синхронно, до решения,
 * делать ли запрос ставок вовсе (⑪). Сами ставки — обычный `useQuery`:
 * переключатель «Показывать отменённые» меняет параметр `all` уже после
 * монтирования (loader греет только `all: true`), и `keepPreviousData`
 * убирает мигание таблицы при повторном запросе (0.66).
 * @param auctionUuid `order_uid` аукциона из маршрута.
 * @returns Разрешения, ставки, счётчик участников и состояние переключателя.
 */
export const useAuctionBets = (auctionUuid: string) => {
  const [showCanceled, setShowCanceled] = useState(true);
  const { data: detail } = useSuspenseQuery(auctionDetailQueryOptions(auctionUuid));
  const permissions = mapAuctionPermissions(detail);
  const vatMode = useVatModeStore((state) => state.mode);
  const currentSubscriberId = useCurrentUserStore((state) => state.subscriberId);

  const betsQuery = useQuery({
    ...auctionBetsQueryOptions({ auctionUuid, all: showCanceled }),
    enabled: !permissions.hideBetsHistory,
    placeholderData: keepPreviousData,
  });

  const bets = useMemo(
    () => (betsQuery.data?.bets ?? []).map((bet) => mapBet(bet, vatMode, currentSubscriberId)),
    [betsQuery.data, vatMode, currentSubscriberId],
  );

  const participantsCount = useMemo(
    () => countBetParticipants(betsQuery.data?.bets ?? []),
    [betsQuery.data],
  );

  return {
    permissions,
    bets,
    participantsCount,
    showCanceled,
    setShowCanceled,
    isPending: betsQuery.isPending,
    isError: betsQuery.isError,
    error: betsQuery.error,
  };
};
