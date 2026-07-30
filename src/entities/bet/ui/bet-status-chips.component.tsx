import { Chip, Stack, Tooltip } from '@mui/material';

import { type BetVm } from '../model/bet.types';

export interface BetStatusChipsProps {
  bet: Pick<BetVm, 'isWin' | 'isCounter' | 'isCanceled' | 'cancelReason'>;
  /** Причина отмены — во всплывающей подсказке (desktop-строка) вместо строки под чипами. */
  reasonInTooltip?: boolean;
}

/**
 * Победитель / встречная / отменённая — один набор чипов для строки таблицы
 * и мобильной карточки. Вынесен из обоих компонентов: до рефакторинга фазы 7
 * тот же JSX-блок был скопирован дословно в оба места (ревью качества).
 */
export const BetStatusChips = ({ bet, reasonInTooltip = false }: BetStatusChipsProps) => {
  if (!bet.isWin && !bet.isCounter && !bet.isCanceled) return null;

  const canceledChip = <Chip size="small" color="error" variant="outlined" label="Отменена" />;

  return (
    <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap' }}>
      {bet.isWin ? <Chip size="small" color="success" label="Победитель" /> : null}
      {bet.isCounter ? (
        <Chip size="small" color="info" variant="outlined" label="Встречная" />
      ) : null}
      {bet.isCanceled ? (
        reasonInTooltip ? (
          <Tooltip title={bet.cancelReason ?? ''}>{canceledChip}</Tooltip>
        ) : (
          canceledChip
        )
      ) : null}
    </Stack>
  );
};
