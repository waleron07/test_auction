import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';

import { BetRow, type BetVm } from '@/entities/bet';

export interface BetsTableProps {
  bets: BetVm[];
  /** `false` при `permissions.hidePlaces` — колонка не рендерится вовсе. */
  showPlace: boolean;
}

/**
 * Таблица ставок (desktop). Горизонтальный скролл живёт внутри
 * `TableContainer` — единственное место в проекте, где он намеренный (0.7).
 */
export const BetsTable = ({ bets, showPlace }: BetsTableProps) => (
  <TableContainer sx={{ overflowX: 'auto' }}>
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Дата</TableCell>
          <TableCell>Перевозчик</TableCell>
          <TableCell align="right">Цена</TableCell>
          {showPlace ? <TableCell align="center">Место</TableCell> : null}
          <TableCell>Статус</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {bets.map((bet) => (
          <BetRow key={bet.id} bet={bet} showPlace={showPlace} />
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);
