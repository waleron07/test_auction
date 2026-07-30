import { Box, Skeleton, Stack, Typography } from '@mui/material';

import { ApiErrorState } from '@/shared/ui';
import {
  BetsCardList,
  BetsEmpty,
  BetsHidden,
  BetsTable,
  ShowCanceledToggle,
} from '@/widgets/bets-table';

import { useAuctionBets } from '../model/use-auction-bets.hook';

export interface AuctionBetsPageProps {
  auctionUuid: string;
}

/**
 * Страница истории ставок.
 *
 * `hideBetsHistory` заменяет всю страницу на `BetsHidden` — запрос ставок при
 * этом не выполняется (`enabled: false` в хуке), поэтому проверка идёт до
 * рендера таблицы, а не после (⑪).
 */
export const AuctionBetsPage = ({ auctionUuid }: AuctionBetsPageProps) => {
  const {
    permissions,
    bets,
    participantsCount,
    showCanceled,
    setShowCanceled,
    isPending,
    isError,
    error,
  } = useAuctionBets(auctionUuid);

  if (permissions.hideBetsHistory) return <BetsHidden />;

  const showPlace = !permissions.hidePlaces;

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={1}
        sx={{ alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}
      >
        <Typography variant="h1" component="h1">
          Ставки
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Участников: {participantsCount}
        </Typography>
      </Stack>

      <ShowCanceledToggle checked={showCanceled} onChange={setShowCanceled} />

      {isError ? <ApiErrorState error={error} /> : null}

      {isPending ? (
        <Skeleton variant="rounded" height={280} aria-label="Загрузка ставок" />
      ) : bets.length === 0 ? (
        <BetsEmpty />
      ) : (
        <>
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <BetsTable bets={bets} showPlace={showPlace} />
          </Box>
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <BetsCardList bets={bets} showPlace={showPlace} />
          </Box>
        </>
      )}
    </Stack>
  );
};
