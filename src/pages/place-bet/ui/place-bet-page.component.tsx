import { Dialog, DialogContent, DialogTitle, Stack, Typography } from '@mui/material';
import { useNavigate } from '@tanstack/react-router';

import { PlaceBetForm } from '@/features/place-bet';
import { useIsMobile, useIsShortViewport } from '@/shared/config/breakpoints';

import { usePlaceBetPage } from '../model/use-place-bet-page.hook';

export interface PlaceBetPageProps {
  auctionUuid: string;
}

/**
 * Страница установки ставки.
 *
 * Один и тот же маршрут (`/auctions/$uuid/bet`) рендерится по-разному в
 * зависимости от размера экрана (0.7, правило 7): на mobile форма — обычная
 * full-screen страница, на desktop — `Dialog` поверх детальной. Узкий по
 * высоте landscape (телефон, высота < 500px) тоже уходит на full-screen —
 * иначе `Dialog` не помещается и обрезается (0.7, правило 5).
 *
 * Закрытие диалога и «Отмена» на full-screen — одно и то же действие:
 * возврат на детальную страницу того же аукциона.
 */
export const PlaceBetPage = ({ auctionUuid }: PlaceBetPageProps) => {
  const { detail, auction } = usePlaceBetPage(auctionUuid);
  const navigate = useNavigate({ from: '/auctions/$auctionUuid/bet' });
  const isMobile = useIsMobile();
  const isShortViewport = useIsShortViewport();
  const asDialog = !isMobile && !isShortViewport;

  const close = (): void => {
    void navigate({ to: '/auctions/$auctionUuid', params: { auctionUuid } });
  };

  const form = (
    <PlaceBetForm
      auctionUuid={auctionUuid}
      trading={auction.trading}
      price={detail.trading.price}
      aucType={detail.main.auc_type ?? 'Unknown'}
      bidMeasurementType={detail.trading.bid_measurement_type}
      onClose={close}
    />
  );

  if (asDialog) {
    return (
      <Dialog open onClose={close} maxWidth="sm" fullWidth>
        <DialogTitle>Ставка на аукцион {auction.cargoNum}</DialogTitle>
        <DialogContent>{form}</DialogContent>
      </Dialog>
    );
  }

  return (
    <Stack spacing={2} sx={{ maxWidth: 480, mx: 'auto' }}>
      <Typography variant="h1" component="h1">
        Ставка на аукцион {auction.cargoNum}
      </Typography>
      {form}
    </Stack>
  );
};
