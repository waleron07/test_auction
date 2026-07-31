import { Chip, Stack } from '@mui/material';

import { AuctionBadge, type AuctionTradingVm } from '@/entities/auction';
import { FieldRow, SectionCard } from '@/shared/ui';

export interface AuctionTradingSectionProps {
  trading: AuctionTradingVm;
}

/**
 * Параметры торгов и состояние своей ставки.
 *
 * Цены (текущая/доступная/min/max/step) показаны не здесь, а в
 * `AuctionSummary` — том же блоке, что и кнопка ставки: пользователь должен
 * видеть цену и действие рядом, не листая между секциями.
 */
export const AuctionTradingSection = ({ trading }: AuctionTradingSectionProps) => (
  <SectionCard title="Параметры торгов">
    <Stack spacing={1}>
      <FieldRow label="Торговый статус" value={<AuctionBadge badge={trading.status} />} />
      <FieldRow label="Начало торгов" value={trading.startDate} />
      <FieldRow label="Окончание торгов" value={trading.stopDate} />
      <FieldRow
        label="Встречные ставки"
        value={trading.allowCounterBets ? 'Разрешены' : 'Не разрешены'}
      />
      {trading.prolongAfterBetMinutes === null ? null : (
        <FieldRow
          label="Продление после ставки"
          value={`${String(trading.prolongAfterBetMinutes)} мин`}
        />
      )}

      <FieldRow
        label="Моя ставка"
        value={
          trading.hasMyBet ? (
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'flex-end' }}>
              <span>{trading.myBet.text}</span>
              {trading.isWinner ? <Chip size="small" color="success" label="Победитель" /> : null}
            </Stack>
          ) : (
            'Ставок нет'
          )
        }
      />
    </Stack>
  </SectionCard>
);
