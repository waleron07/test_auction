import { Box } from '@mui/material';

import { AuctionCard, mapAuctionCard, resolvePrimaryAction } from '@/entities/auction';
import { useCachedBidStep } from '@/features/prefetch-auction/model/use-cached-bid-step.hook';
import { usePrefetchAuction } from '@/features/prefetch-auction/model/use-prefetch-auction.hook';
import { type AuctionListItemDto } from '@/shared/api/dto';
import { formatMoney } from '@/shared/lib/number/format-money.util';

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
/**
 * Одна карточка вместе с данными, которые не приходят в списке.
 *
 * Вынесена в отдельный компонент, потому что шаг ставки читается хуком, а хук
 * нельзя звать в цикле: React требует стабильного порядка вызовов.
 */
const AuctionCardListItem = ({
  item,
  onPrefetch,
}: {
  item: AuctionListItemDto;
  onPrefetch: (orderUid: string) => void;
}) => {
  const card = mapAuctionCard(item);
  const step = useCachedBidStep(card.orderUid);

  return (
    <AuctionCard
      auction={card}
      action={resolvePrimaryAction(item)}
      bidStep={step === null ? undefined : formatMoney(step)}
      onPrefetch={() => {
        onPrefetch(card.orderUid);
      }}
    />
  );
};

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
