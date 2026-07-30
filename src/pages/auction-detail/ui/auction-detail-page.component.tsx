import { Box, Chip, Stack, Typography } from '@mui/material';

import { AuctionBadge } from '@/entities/auction';
import {
  AuctionCargoSection,
  AuctionOrganizerSection,
  AuctionPaymentSection,
  AuctionRoutePoints,
  AuctionSummary,
  AuctionTradingSection,
} from '@/widgets/auction-summary';

import { useAuctionDetail } from '../model/use-auction-detail.hook';

export interface AuctionDetailPageProps {
  auctionUuid: string;
}

/**
 * Детальная страница аукциона.
 *
 * Адаптив — одна `grid`-раскладка (ARCHITECTURE, Фаза 6): на desktop вторая
 * колонка — sticky-сайдбар с ценой и CTA, на mobile она уходит под основной
 * контент и превращается в обычный, не закреплённый блок в потоке страницы.
 */
export const AuctionDetailPage = ({ auctionUuid }: AuctionDetailPageProps) => {
  const auction = useAuctionDetail(auctionUuid);

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) minmax(280px, 340px)' },
      }}
    >
      <Stack spacing={3} sx={{ minWidth: 0 }}>
        <Stack spacing={0.5}>
          <Stack direction="row" spacing={1} sx={{ alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="h1" component="h1">
              Аукцион {auction.cargoNum}
            </Typography>
            <AuctionBadge badge={auction.aucType} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Создан: {auction.createdAt}
          </Typography>
        </Stack>

        <AuctionOrganizerSection organizer={auction.organizer} contacts={auction.contacts} />
        <AuctionRoutePoints points={auction.route} />
        <AuctionCargoSection cargo={auction.cargo} />
        <AuctionPaymentSection payment={auction.payment} assembly={auction.assembly} />
        <AuctionTradingSection trading={auction.trading} />

        {auction.admittedOrganizations.length === 0 ? null : (
          <Stack spacing={1}>
            <Typography variant="h3" component="h2">
              Допущенные организации
            </Typography>
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap' }}>
              {auction.admittedOrganizations.map((organization) => (
                <Chip
                  key={organization.inn}
                  label={`${organization.name} (${organization.inn})`}
                  color={organization.isMain ? 'primary' : 'default'}
                  variant={organization.isMain ? 'filled' : 'outlined'}
                />
              ))}
            </Stack>
          </Stack>
        )}
      </Stack>

      <AuctionSummary auctionUuid={auctionUuid} trading={auction.trading} permissions={auction.permissions} />
    </Box>
  );
};
