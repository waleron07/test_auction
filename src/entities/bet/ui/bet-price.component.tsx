import { Stack, Typography } from '@mui/material';

import { type BetVm } from '../model/bet.types';

export interface BetPriceProps {
  price: BetVm['price'];
  vatRate: BetVm['vatRate'];
  /** Зачёркнутая цена — вид отменённой ставки. */
  strikethrough?: boolean;
}

/**
 * Цена ставки с пометкой ставки НДС.
 *
 * `isFallback` помечается подписью «с НДС»: значит, показано базовое значение
 * вместо запрошенного «без НДС», потому что близнеца `price_no_vat` в этой
 * ставке нет (⑦) — то же решение, что и у цены аукциона, но для строки истории.
 */
export const BetPrice = ({ price, vatRate, strikethrough = false }: BetPriceProps) => (
  <Stack spacing={0} sx={{ alignItems: 'flex-end' }}>
    <Typography
      variant="body2"
      sx={{
        whiteSpace: 'nowrap',
        fontVariantNumeric: 'tabular-nums',
        textDecoration: strikethrough ? 'line-through' : 'none',
      }}
    >
      {price.text}
    </Typography>
    <Typography variant="caption" color="text.secondary">
      {price.isFallback ? 'с НДС' : `НДС ${vatRate}`}
    </Typography>
  </Stack>
);
