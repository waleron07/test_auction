import { Paper, Stack, Typography } from '@mui/material';

import { type BetVm } from '../model/bet.types';

import { BetPlaceBadge } from './bet-place-badge.component';
import { BetPrice } from './bet-price.component';
import { BetStatusChips } from './bet-status-chips.component';

export interface BetCardProps {
  bet: BetVm;
  /** Показывать ли место — `false` при `permissions.hidePlaces`. */
  showPlace: boolean;
}

/** Карточка ставки (mobile) — таблица на узком экране нечитаема. */
export const BetCard = ({ bet, showPlace }: BetCardProps) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      opacity: bet.isCanceled ? 0.6 : 1,
      borderColor: bet.isMine ? 'primary.main' : undefined,
    }}
  >
    <Stack spacing={1}>
      <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Stack spacing={0}>
          <Typography variant="body2">{bet.organizationName}</Typography>
          <Typography variant="caption" color="text.secondary">
            ИНН {bet.organizationInn} · {bet.createdAt}
          </Typography>
        </Stack>
        {showPlace ? <BetPlaceBadge place={bet.place} /> : null}
      </Stack>

      <BetPrice price={bet.price} vatRate={bet.vatRate} strikethrough={bet.isCanceled} />

      <BetStatusChips bet={bet} />

      {bet.isCanceled && bet.cancelReason !== null ? (
        <Typography variant="caption" color="text.secondary">
          Причина: {bet.cancelReason}
        </Typography>
      ) : null}
    </Stack>
  </Paper>
);
