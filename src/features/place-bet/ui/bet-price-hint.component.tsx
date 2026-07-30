import { Stack, Typography } from '@mui/material';

import { type AuctionTradingVm } from '@/entities/auction';
import { FieldRow } from '@/shared/ui';

export interface BetPriceHintProps {
  trading: Pick<AuctionTradingVm, 'current' | 'available' | 'min' | 'max' | 'step'>;
}

/**
 * Подсказка формы: текущая цена, доступная цена, границы и шаг — в текущем
 * режиме отображения НДС, плюс явная пометка про базу отправки (ловушка ⑧).
 *
 * Пометка нужна именно здесь, а не в тексте каждой ошибки Zod: `create-bet-
 * schema.util.ts` сравнивает с базовыми (с НДС) значениями всегда, независимо
 * от того, что выбрано тумблером НДС на странице — пользователь должен знать
 * это один раз, до того как начнёт вводить число, а не выяснять по ошибке.
 */
export const BetPriceHint = ({ trading }: BetPriceHintProps) => (
  <Stack spacing={0.5}>
    <FieldRow label="Текущая цена" value={trading.current.text} />
    <FieldRow label="Доступно" value={trading.available.text} />
    <FieldRow label="Мин / Макс" value={`${trading.min.text} / ${trading.max.text}`} />
    <FieldRow label="Шаг" value={trading.step.text} />
    <Typography variant="caption" color="text.secondary">
      Ставка отправляется с НДС независимо от выбранного режима отображения цены.
    </Typography>
  </Stack>
);
