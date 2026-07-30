import { Stack } from '@mui/material';

import { BetCard, type BetVm } from '@/entities/bet';

export interface BetsCardListProps {
  bets: BetVm[];
  /** `false` при `permissions.hidePlaces`. */
  showPlace: boolean;
}

/** Список карточек ставок (mobile) — таблица на узком экране нечитаема. */
export const BetsCardList = ({ bets, showPlace }: BetsCardListProps) => (
  <Stack spacing={1.5}>
    {bets.map((bet) => (
      <BetCard key={bet.id} bet={bet} showPlace={showPlace} />
    ))}
  </Stack>
);
