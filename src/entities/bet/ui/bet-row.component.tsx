import { Stack, TableCell, TableRow, Typography } from '@mui/material';

import { type BetVm } from '../model/bet.types';

import { BetPlaceBadge } from './bet-place-badge.component';
import { BetPrice } from './bet-price.component';
import { BetStatusChips } from './bet-status-chips.component';

export interface BetRowProps {
  bet: BetVm;
  /** Показывать ли колонку места — `false` при `permissions.hidePlaces`. */
  showPlace: boolean;
}

/** Строка таблицы истории ставок (desktop). */
export const BetRow = ({ bet, showPlace }: BetRowProps) => (
  <TableRow
    sx={{
      opacity: bet.isCanceled ? 0.6 : 1,
      bgcolor: bet.isMine ? 'action.selected' : 'transparent',
    }}
  >
    <TableCell sx={{ whiteSpace: 'nowrap' }}>{bet.createdAt}</TableCell>
    <TableCell>
      <Stack spacing={0}>
        <Typography variant="body2">{bet.organizationName}</Typography>
        <Typography variant="caption" color="text.secondary">
          ИНН {bet.organizationInn}
        </Typography>
      </Stack>
    </TableCell>
    <TableCell align="right">
      <BetPrice price={bet.price} vatRate={bet.vatRate} strikethrough={bet.isCanceled} />
    </TableCell>
    {showPlace ? (
      <TableCell align="center">
        <BetPlaceBadge place={bet.place} />
      </TableCell>
    ) : null}
    <TableCell>
      <BetStatusChips bet={bet} reasonInTooltip />
    </TableCell>
  </TableRow>
);
