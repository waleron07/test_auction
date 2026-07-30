import { Stack, Typography } from '@mui/material';

import { type OrganizerVm } from '../model/organizer.types';

export interface OrganizerInfoProps {
  organizer: OrganizerVm;
}

/**
 * Название и ИНН организатора.
 *
 * Тип берётся из локального `organizer.types.ts`, а не из `entities/auction`:
 * сущности одного уровня FSD не импортируют друг друга. Форма совпадает с
 * `AuctionDetailVm.organizer` по построению — обе описывают один и тот же
 * кусок ответа detail, — а связывает их страница, которая передаёт объект
 * маппера в проп этого компонента.
 */
export const OrganizerInfo = ({ organizer }: OrganizerInfoProps) => (
  <Stack spacing={0.5}>
    <Typography variant="body1">{organizer.name}</Typography>
    <Typography variant="caption" color="text.secondary">
      ИНН {organizer.inn}
    </Typography>
  </Stack>
);
