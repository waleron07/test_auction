import { Paper, Stack, Typography } from '@mui/material';

import { type AuctionPermissions, type AuctionTradingVm } from '@/entities/auction';
import { VatToggle } from '@/features/vat-toggle';
import { FieldRow, RouterButton } from '@/shared/ui';

export interface AuctionSummaryProps {
  auctionUuid: string;
  trading: AuctionTradingVm;
  permissions: AuctionPermissions;
}

/**
 * Sticky-сайдбар: цена, тумблер НДС и основное действие — рядом, а не
 * растащены по секциям, чтобы решение о ставке принималось на месте.
 *
 * Кнопка ведёт на `/bet`, только если `permissions.canSetBet`; иначе — на
 * `/bets` (посмотреть без права ставить). Причины недоступности здесь нет:
 * задание требует её только для закрытых торгов в **списке** (㉛), а на
 * detail статус торгов уже виден в соседней секции.
 */
export const AuctionSummary = ({ auctionUuid, trading, permissions }: AuctionSummaryProps) => (
  <Paper variant="outlined" sx={{ p: 2, position: { md: 'sticky' }, top: { md: 16 } }}>
    <Stack spacing={2}>
      <VatToggle />

      <Stack spacing={1}>
        <FieldRow label="Текущая цена" value={trading.current.text} />
        <FieldRow label="Доступно" value={trading.available.text} />
        <FieldRow label="Мин / Макс" value={`${trading.min.text} / ${trading.max.text}`} />
        <FieldRow label="Шаг" value={trading.step.text} />
        <FieldRow label="Цена за км" value={trading.pricePerKm} />
      </Stack>

      {permissions.canSetBet ? (
        <RouterButton
          to="/auctions/$auctionUuid/bet"
          params={{ auctionUuid }}
          variant="contained"
          size="large"
          fullWidth
        >
          {trading.hasMyBet ? 'Изменить ставку' : 'Сделать ставку'}
        </RouterButton>
      ) : (
        <RouterButton
          to="/auctions/$auctionUuid/bets"
          params={{ auctionUuid }}
          variant="outlined"
          size="large"
          fullWidth
        >
          Смотреть ставки
        </RouterButton>
      )}

      {trading.hasMyBet && !permissions.canSetBet ? (
        <Typography variant="caption" color="text.secondary">
          Ваша ставка: {trading.myBet.text}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
);
