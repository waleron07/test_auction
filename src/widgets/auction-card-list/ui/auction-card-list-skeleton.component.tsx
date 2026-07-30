import { Box } from '@mui/material';

import { AuctionCardSkeleton } from '@/entities/auction';

import { AUCTION_GRID_SX } from './auction-grid.const';

export interface AuctionCardListSkeletonProps {
  /** Сколько карточек показать: столько же, сколько ждём с сервера. */
  count?: number;
}

/**
 * Скелетон сетки. Сетка берётся из той же константы, что и у реального списка:
 * иначе при появлении данных страница дёргается — ровно то, ради чего скелетон
 * и существует (5.4).
 */
export const AuctionCardListSkeleton = ({ count = 6 }: AuctionCardListSkeletonProps) => (
  <Box aria-busy="true" aria-label="Загрузка списка аукционов" sx={AUCTION_GRID_SX}>
    {Array.from({ length: count }, (_, index) => (
      <AuctionCardSkeleton key={index} />
    ))}
  </Box>
);
