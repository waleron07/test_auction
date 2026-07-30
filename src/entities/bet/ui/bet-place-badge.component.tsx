import { Chip } from '@mui/material';

export interface BetPlaceBadgeProps {
  /** Место в рейтинге ставок. `null` — места нет (ставка отменена или не ранжирована). */
  place: number | null;
}

/**
 * Бейдж места в рейтинге. Первое место выделено цветом, остальные — нейтрально.
 */
export const BetPlaceBadge = ({ place }: BetPlaceBadgeProps) =>
  place === null ? null : (
    <Chip label={`№${String(place)}`} size="small" color={place === 1 ? 'success' : 'default'} />
  );
