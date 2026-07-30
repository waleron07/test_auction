import { Chip } from '@mui/material';

import { type BadgeVm } from '../model/auction.types';

export interface AuctionBadgeProps {
  /** Значение enum, уже разобранное маппером в лейбл и цвет. */
  badge: BadgeVm;
  /** Размер: карточка списка использует компактный. */
  size?: 'small' | 'medium';
}

/**
 * Бейдж значения enum.
 *
 * Компонент не знает ни одного значения enum'а и не содержит `switch`: лейбл и
 * цвет приходят из словаря через маппер (④). Поэтому новое значение в схеме
 * не требует правки разметки — только словаря.
 */
export const AuctionBadge = ({ badge, size = 'small' }: AuctionBadgeProps) => (
  <Chip label={badge.label} color={badge.color} size={size} variant="filled" />
);
