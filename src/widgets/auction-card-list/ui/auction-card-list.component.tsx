import { Box } from '@mui/material';

import { AuctionCard, mapAuctionCard, resolvePrimaryAction } from '@/entities/auction';
import { usePrefetchAuction } from '@/features/prefetch-auction/model/use-prefetch-auction.hook';
import { type AuctionListItemDto } from '@/shared/api/dto';

export interface AuctionCardListProps {
  /** Элементы текущей страницы списка. */
  items: AuctionListItemDto[];
}

/**
 * Сетка карточек.
 *
 * Здесь сходятся три слоя: карточка из `entities`, prefetch-хук из `features`
 * и сам виджет. Направление импортов соблюдено — виджет знает про фичу, фича
 * про сущность, обратного пути нет; именно поэтому обработчик прогрева
 * подписывается тут, а не внутри карточки (ARCHITECTURE 4.1).
 *
 * Сетка адаптивная по карте ширин 0.7: одна колонка на телефоне, две на
 * планшете, три на десктопе.
 */
export const AuctionCardList = ({ items }: AuctionCardListProps) => {
  const prefetchAuction = usePrefetchAuction();

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 2,
        gridTemplateColumns: {
          xs: '1fr',
          md: 'repeat(2, minmax(0, 1fr))',
          lg: 'repeat(3, minmax(0, 1fr))',
        },
      }}
    >
      {items.map((item) => {
        const card = mapAuctionCard(item);

        return (
          <AuctionCard
            key={card.orderUid}
            auction={card}
            action={resolvePrimaryAction(item)}
            onPrefetch={() => {
              prefetchAuction(card.orderUid);
            }}
          />
        );
      })}
    </Box>
  );
};
