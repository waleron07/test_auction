import { Button, Stack } from '@mui/material';

import { formatMoney } from '@/shared/lib/number/format-money.util';

export interface BetStepButtonsProps {
  /** Шаг ставки. `null` — шага нет (не задан или `<= 0`, испорченные данные — ⑦). */
  step: number | null;
  /** Текущее значение поля цены; `null`, пока поле пустое или не число. */
  value: number | null;
  onChange: (next: number) => void;
}

/**
 * Кнопки быстрого шага `−step` / `+step`.
 *
 * Ничего не рендерит при отсутствующем шаге — кнопки без шага бессмысленны, а
 * не «шаг по умолчанию 1»: придумывать значение, которого нет в контракте,
 * опаснее, чем скрыть кнопки.
 *
 * Тач-цели ≥ 44px (0.7): это кнопки повторного нажатия на мобильном экране, и
 * MUI по умолчанию даёт меньше.
 */
export const BetStepButtons = ({ step, value, onChange }: BetStepButtonsProps) => {
  if (step === null) return null;

  const base = value ?? 0;
  const label = formatMoney(step);

  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="outlined"
        size="small"
        sx={{ minWidth: 44, minHeight: 44 }}
        onClick={() => {
          onChange(base - step);
        }}
      >
        −{label}
      </Button>
      <Button
        variant="outlined"
        size="small"
        sx={{ minWidth: 44, minHeight: 44 }}
        onClick={() => {
          onChange(base + step);
        }}
      >
        +{label}
      </Button>
    </Stack>
  );
};
