import { Box } from '@mui/material';
import { memo } from 'react';

import { AuctionCard, mapAuctionCard, resolvePrimaryAction } from '@/entities/auction';
import { useCachedBidStep } from '@/features/prefetch-auction/model/use-cached-bid-step.hook';
import { usePrefetchAuction } from '@/features/prefetch-auction/model/use-prefetch-auction.hook';
import { type AuctionListItemDto } from '@/shared/api/dto';
import { formatPrice } from '@/shared/lib/number/format-price.util';
import { resolvePriceUnit } from '@/shared/lib/number/resolve-price-unit.util';

import { AUCTION_GRID_SX } from './auction-grid.const';

export interface AuctionCardListProps {
  /** Элементы текущей страницы списка. */
  items: AuctionListItemDto[];
}

interface AuctionCardListItemProps {
  item: AuctionListItemDto;
  onPrefetch: (orderUid: string) => void;
}

/**
 * Одна карточка вместе с данными, которых нет в ответе списка.
 *
 * Вынесена в отдельный компонент по двум причинам. Во-первых, шаг ставки
 * читается хуком, а хук нельзя звать в цикле. Во-вторых, `memo` здесь снимает
 * лишний проход по всему списку: `keepPreviousData` рендерит страницу дважды —
 * сначала с прежними данными, потом с новыми, — и без мемоизации первый проход
 * заново строит все карточки MUI по неизменившимся объектам.
 *
 * Шаг форматируется той же парой «сумма + единица», что и цена: «199 ₽» под
 * ценой «199 ₽/км» читалось бы как другая величина.
 */
const AuctionCardListItem = memo(({ item, onPrefetch }: AuctionCardListItemProps) => {
  const card = mapAuctionCard(item);
  const step = useCachedBidStep(card.orderUid);
  const unit = resolvePriceUnit(item.trading?.bid_measurement_type);

  return (
    <AuctionCard
      auction={card}
      action={resolvePrimaryAction(item)}
      bidStep={step === null ? undefined : formatPrice(step, unit)}
      onPrefetch={() => {
        onPrefetch(card.orderUid);
      }}
    />
  );
});

AuctionCardListItem.displayName = 'AuctionCardListItem';

/**
 * Сетка карточек.
 *
 * Здесь сходятся три слоя: карточка из `entities`, prefetch-хук из `features`
 * и сам виджет. Направление импортов соблюдено — виджет знает про фичу, фича
 * про сущность, обратного пути нет; именно поэтому обработчик прогрева
 * подписывается тут, а не внутри карточки (ARCHITECTURE 4.1).
 */
export const AuctionCardList = ({ items }: AuctionCardListProps) => {
  const prefetchAuction = usePrefetchAuction();

  return (
    <Box sx={AUCTION_GRID_SX}>
      {items.map((item) => (
        <AuctionCardListItem
          key={item.main?.order_uid ?? ''}
          item={item}
          onPrefetch={prefetchAuction}
        />
      ))}
    </Box>
  );
};
