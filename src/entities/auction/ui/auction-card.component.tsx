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

/**
 * Высота ряда бейджей: два ряда чипов.
 *
 * Число бейджей одинаково, а вот их подписи — нет: «Фиксированная цена» и
 * «Не участвую» занимают вдвое больше места, чем «Торги идут», и ряд то
 * переносится, то нет. Резервируем место под перенос всегда, иначе соседние
 * карточки в сетке разъезжаются по вертикали на высоту одного чипа.
 */
const BADGES_MIN_HEIGHT = 60;

/** Высота строки «цена за км · шаг»: она есть не всегда, место под неё — всегда. */
const META_LINE_MIN_HEIGHT = 20;

/**
 * Собирает строку «цена за км · шаг».
 *
 * Шаг приходит из кэша detail и есть не всегда: пока его нет, строка остаётся
 * короче, но её высота не меняется.
 * @param pricePerKm Цена за километр, уже отформатированная маппером.
 * @param bidStep Шаг ставки либо `undefined`, если detail ещё не загружен.
 * @returns Готовая строка для подписи под ценой.
 */
const metaLine = (pricePerKm: string, bidStep: string | undefined): string =>
  bidStep === undefined ? pricePerKm : `${pricePerKm} · Шаг: ${bidStep}`;

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
 *
 * **Заголовок маршрута — ссылка на детальную страницу.** Primary action ведёт
 * на `/bet` или `/bets`, а не на саму карточку аукциона — переход к разделам
 * detail (маршрут, груз, торги) идёт через заголовок, обычный `<Link>` без
 * прокидывания через MUI `component` (та же generic-проблема, что решена
 * `createLink` для `RouterButton` — здесь дешевле обойти её, вложив `<Link>`
 * простым потомком `Typography`, а не через её `component`).
 *
 * **Высота блоков не зависит от длины текста.** В сетке карточки стоят рядом,
 * и любая строка, которая переносится в одной карточке и не переносится в
 * соседней, сдвигает вниз всё, что под ней: цены оказываются на разной высоте,
 * кнопки — тоже. Поэтому длинные значения обрезаются многоточием (полный текст
 * остаётся в `title`), а под переменные блоки — ряд бейджей и строку
 * «цена за км · шаг» — место зарезервировано заранее.
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
      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        sx={{
          flexWrap: 'wrap',
          alignContent: 'flex-start',
          minHeight: BADGES_MIN_HEIGHT,
        }}
      >
        <AuctionBadge badge={auction.status} />
        <AuctionBadge badge={auction.aucType} />
        <AuctionBadge badge={auction.tradingStatus} />
        {auction.hasMyBet ? <Chip label="Моя ставка" size="small" variant="outlined" /> : null}
      </Stack>

      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h3" component="h2" noWrap title={auction.route}>
          <Link
            to="/auctions/$auctionUuid"
            params={{ auctionUuid: auction.orderUid }}
            style={{ color: 'inherit' }}
          >
            {auction.route}
          </Link>
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          component="p"
          title={`Заявка ${auction.cargoNum} · ${auction.organizer}`}
        >
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

      <Box sx={{ mt: 'auto', minWidth: 0 }}>
        <Typography variant="h3" component="p" noWrap title={auction.price}>
          {auction.price}
        </Typography>
        {/*
          Цена за км и шаг — одной строкой фиксированной высоты. Раньше они
          лежали рядом с ценой и переносились по-разному в зависимости от длины
          суммы: в одной карточке шаг оказывался в строке цены, в соседней —
          под ней, и низ карточек расходился.
        */}
        <Typography
          variant="caption"
          color="text.secondary"
          component="p"
          noWrap
          sx={{ minHeight: META_LINE_MIN_HEIGHT }}
          title={metaLine(auction.pricePerKm, bidStep)}
        >
          {metaLine(auction.pricePerKm, bidStep)}
        </Typography>
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
