import { Box, CircularProgress } from '@mui/material';

/**
 * `pendingComponent` маршрутов. Показывается не раньше `defaultPendingMs`
 * и не короче `defaultPendingMinMs` — иначе быстрый ответ мока даёт моргание,
 * которое читается как баг (PLAN 0.66).
 */
export const RoutePending = () => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 6, md: 10 } }}>
    <CircularProgress aria-label="Загрузка" />
  </Box>
);
