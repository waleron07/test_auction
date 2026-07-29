import RefreshIcon from '@mui/icons-material/Refresh';
import { Alert, AlertTitle, Box, Button, Stack, Typography } from '@mui/material';

export interface ErrorStateProps {
  /** Заголовок: короткое название типа ошибки («Сервис недоступен»). */
  title: string;
  /** Пояснение конкретного случая. */
  message: string;
  /** Идентификатор запроса для корреляции с логами, если пришёл от API. */
  traceId?: string | null;
  /** Обработчик повторной попытки. Кнопка не рендерится, если не передан. */
  onRetry?: (() => void) | undefined;
  /** Подпись кнопки повтора. */
  retryLabel?: string;
  /** Дополнительное действие рядом с повтором (например, «На главную»). */
  action?: React.ReactNode;
}

/**
 * Единый вид ошибки на весь проект: и для inline-состояний TanStack Query,
 * и для `errorComponent` роутера. Разные источники ошибок дают разные пропсы,
 * но выглядит ошибка одинаково — иначе интерфейс распадается на диалекты.
 */
export const ErrorState = ({
  title,
  message,
  traceId,
  onRetry,
  retryLabel = 'Повторить',
  action,
}: ErrorStateProps) => (
  <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, md: 8 }, px: 2 }}>
    <Alert severity="error" variant="outlined" sx={{ maxWidth: 560, width: '100%' }}>
      <AlertTitle>{title}</AlertTitle>
      <Typography variant="body2" sx={{ mb: 1.5 }}>
        {message}
      </Typography>

      {traceId ? (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
          trace_id: {traceId}
        </Typography>
      ) : null}

      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
        {onRetry ? (
          <Button size="small" variant="contained" startIcon={<RefreshIcon />} onClick={onRetry}>
            {retryLabel}
          </Button>
        ) : null}
        {action}
      </Stack>
    </Alert>
  </Box>
);
