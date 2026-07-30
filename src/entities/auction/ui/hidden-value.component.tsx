import { Typography } from '@mui/material';

import { HIDDEN_BY_ORGANIZER } from '../lib/hidden-value.const';

export interface HiddenValueProps {
  /** Готовый текст из ViewModel — уже решено, скрыт он или нет. */
  value: string;
}

/**
 * Значение, которое может быть скрыто организатором.
 *
 * Решение «скрыто или нет» уже принято маппером (`mapAuctionDetail`) и
 * выражено самим текстом: компонент не читает флаги `permissions` — он лишь
 * сравнивает готовую строку с одной и той же константой, что и маппер, и
 * подчёркивает её приглушённым курсивом, чтобы «Скрыто организатором» не
 * читалось как настоящий адрес или телефон.
 */
export const HiddenValue = ({ value }: HiddenValueProps) =>
  value === HIDDEN_BY_ORGANIZER ? (
    <Typography
      component="span"
      variant="body2"
      color="text.secondary"
      sx={{ fontStyle: 'italic' }}
    >
      {value}
    </Typography>
  ) : (
    <Typography component="span" variant="body2">
      {value}
    </Typography>
  );
