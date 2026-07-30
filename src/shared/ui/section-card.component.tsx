import { Paper, Stack, Typography } from '@mui/material';

export interface SectionCardProps {
  title: string;
  children: React.ReactNode;
}

/**
 * Единая обёртка секции детальной страницы: заголовок + карточка.
 *
 * Секций на detail шесть (организатор, маршрут, груз, оплата, торги плюс
 * сайдбар), и без общей обёртки заголовок каждой оформлялся бы чуть иначе —
 * ровно тот класс расхождений, который бросается в глаза на скриншоте, а не
 * на код-ревью.
 */
export const SectionCard = ({ title, children }: SectionCardProps) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Stack spacing={1.5}>
      <Typography variant="h3" component="h2">
        {title}
      </Typography>
      {children}
    </Stack>
  </Paper>
);
