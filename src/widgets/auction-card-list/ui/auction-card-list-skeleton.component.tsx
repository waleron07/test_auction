import { Box } from '@mui/material';

import { AuctionCardSkeleton } from '@/entities/auction';

export interface AuctionCardListSkeletonProps {
  /** Сколько карточек показать: столько же, сколько ждём с сервера. */
  count?: number;
}

/**
 * Скелетон сетки. Сетка та же самая, что у реального списка, — иначе при
 * появлении данных страница дёргается (5.4).
 */
export const AuctionCardListSkeleton = ({ count = 6 }: AuctionCardListSkeletonProps) => (
  <Box
    aria-busy="true"
    aria-label="Загрузка списка аукционов"
    sx={{
      display: 'grid',
      gap: 2,
      gridTemplateColumns: {
        xs: '1fr',
        md: 'repeat(2, minmax(0, 1fr))',
        lg: 'repeat(3, minmax(0, 1fr))',
      },
    }}
  >
    {Array.from({ length: count }, (_, index) => (
      <AuctionCardSkeleton key={index} />
    ))}
  </Box>
);
