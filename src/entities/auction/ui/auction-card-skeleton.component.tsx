import { Card, CardContent, Skeleton, Stack } from '@mui/material';

/**
 * Скелетон карточки.
 *
 * Повторяет структуру и высоту настоящей карточки: скелетон другой высоты
 * даёт скачок вёрстки в момент прихода данных — это заметнее, чем сама
 * задержка (5.4).
 */
export const AuctionCardSkeleton = () => (
  <Card sx={{ height: '100%' }}>
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Stack direction="row" spacing={1}>
        <Skeleton variant="rounded" width={90} height={24} />
        <Skeleton variant="rounded" width={110} height={24} />
      </Stack>
      <Skeleton variant="text" width="70%" height={32} />
      <Skeleton variant="text" width="45%" />
      <Skeleton variant="rounded" height={72} />
      <Skeleton variant="text" width="40%" height={32} />
      <Skeleton variant="rounded" height={40} />
    </CardContent>
  </Card>
);
