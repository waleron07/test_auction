import { Box, Stack, Typography } from '@mui/material';

export interface EmptyStateProps {
  /** Заголовок пустого состояния. */
  title: string;
  /** Пояснение и подсказка, что делать дальше. */
  message?: string;
  /** Действие: чаще всего «Сбросить фильтры». */
  action?: React.ReactNode;
}

/** Единый вид пустого состояния: список без результатов, аукцион без ставок. */
export const EmptyState = ({ title, message, action }: EmptyStateProps) => (
  <Box sx={{ textAlign: 'center', py: { xs: 5, md: 8 }, px: 2 }}>
    <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
      <Typography variant="h3">{title}</Typography>
      {message ? (
        <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
          {message}
        </Typography>
      ) : null}
      {action}
    </Stack>
  </Box>
);
