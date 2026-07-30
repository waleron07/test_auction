import { Box, Button, Card, CardContent, Chip, Stack, Tooltip, Typography } from '@mui/material';
import { Link } from '@tanstack/react-router';

import { type PrimaryAction } from '../lib/resolve-primary-action.util';
import { type AuctionCardVm } from '../model/auction.types';

import { AuctionBadge } from './auction-badges.component';

export interface AuctionCardProps {
  /** Готовая ViewModel: компонент — разметка, решения приняты в маппере. */
  auction: AuctionCardVm;
  /** Основное действие, вычисленное `resolvePrimaryAction`. */
  action: PrimaryAction;
  /**
   * Прогрев кэша детальной при наведении.
   *
   * Приходит пропом, а не хуком внутри: хук `usePrefetchAuction` живёт в слое
   * `features`, а карточка — в `entities`, и импорт вверх запрещён. Подписывает
   * обработчик виджет списка (ARCHITECTURE 4.1).
   */
  onPrefetch?: (() => void) | undefined;
  /**
   * Шаг ставки, отформатированный виджетом.
   *
   * В DTO списка шага нет вовсе (㉑) — он приходит из кэша detail, прогретого
   * prefetch'ем. Пока кэш пуст, блок не рендерится: прочерк на его месте
   * читался бы как «шаг равен нулю».
   */
  bidStep?: string | undefined;
}

/** Строка «подпись — значение» карточки. */
const Field = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ minWidth: 0 }}>
    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
      {label}
    </Typography>
    <Typography variant="body2" noWrap title={value}>
      {value}
    </Typography>
  </Box>
);

/**
 * Карточка аукциона в списке.
 *
 * Все требования задания к карточке закрываются здесь: номер заявки, тип и
 * статус аукциона, торговый статус, маршрут, даты, груз, цена с единицей
 * измерения, цена за км, признак своей ставки и primary action. Отсутствие
 * блока цены (㉛) уже превращено маппером в прочерк, поэтому разметка не
 * ветвится.
 */
export const AuctionCard = ({ auction, action, onPrefetch, bidStep }: AuctionCardProps) => (
  <Card
    component="article"
    aria-label={`Аукцион ${auction.cargoNum}`}
    onMouseEnter={onPrefetch}
    onFocus={onPrefetch}
    sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
  >
    <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flexGrow: 1 }}>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
        <AuctionBadge badge={auction.status} />
        <AuctionBadge badge={auction.aucType} />
        <AuctionBadge badge={auction.tradingStatus} />
        {auction.hasMyBet ? <Chip label="Моя ставка" size="small" variant="outlined" /> : null}
      </Stack>

      <Box>
        <Typography variant="h3" component="h2" noWrap title={auction.route}>
          {auction.route}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Заявка {auction.cargoNum} · {auction.organizer}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 1,
          gridTemplateColumns: { xs: 'repeat(2, minmax(0, 1fr))', sm: 'repeat(3, minmax(0, 1fr))' },
        }}
      >
        <Field label="Погрузка" value={auction.loadDate} />
        <Field label="Выгрузка" value={auction.unloadDate} />
        <Field label="Груз" value={auction.cargo.name} />
        <Field label="Вес" value={auction.cargo.weight} />
        <Field label="Объём" value={auction.cargo.volume} />
        <Field label="Кузов" value={auction.cargo.bodyType} />
      </Box>

      <Box sx={{ mt: 'auto', display: 'flex', gap: 2, alignItems: 'baseline', flexWrap: 'wrap' }}>
        <Typography variant="h3" component="p">
          {auction.price}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {auction.pricePerKm}
        </Typography>
        {bidStep === undefined ? null : (
          <Typography variant="body2" color="text.secondary">
            Шаг: {bidStep}
          </Typography>
        )}
      </Box>

      <Tooltip title={action.reason} disableHoverListener={action.reason === ''}>
        <Box>
          <Button
            fullWidth
            variant="contained"
            disabled={action.disabled}
            component={action.disabled ? 'button' : Link}
            {...(action.disabled
              ? {}
              : { to: action.to, params: { auctionUuid: auction.orderUid } })}
          >
            {action.label}
          </Button>
        </Box>
      </Tooltip>
    </CardContent>
  </Card>
);
