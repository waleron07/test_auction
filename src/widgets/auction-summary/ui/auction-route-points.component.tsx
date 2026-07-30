import { Box, Stack, Typography } from '@mui/material';

import { HiddenValue, type RoutePointVm } from '@/entities/auction';
import { SectionCard } from '@/shared/ui';

export interface AuctionRoutePointsProps {
  points: RoutePointVm[];
}

/**
 * Все точки маршрута — задание требует показать их целиком, а не только
 * первую и последнюю. Адрес и контакт каждой точки уже решены маппером
 * (`HiddenValue` только рисует готовую строку), поэтому виджет не проверяет
 * `permissions` сам.
 */
export const AuctionRoutePoints = ({ points }: AuctionRoutePointsProps) => (
  <SectionCard title="Маршрут">
    <Stack spacing={2} divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
      {points.map((point, index) => (
        <Stack key={index} spacing={0.5}>
          <Typography variant="body1" component="h3">
            {point.operation.label} · {point.city}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {point.date}
          </Typography>
          <HiddenValue value={point.address} />
          <Stack direction="row" spacing={1}>
            <HiddenValue value={point.contactName} />
            <HiddenValue value={point.contactPhone} />
          </Stack>
        </Stack>
      ))}
    </Stack>
  </SectionCard>
);
