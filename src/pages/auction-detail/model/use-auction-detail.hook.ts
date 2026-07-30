import { useSuspenseQuery } from '@tanstack/react-query';

import { auctionDetailQueryOptions, mapAuctionDetail } from '@/entities/auction';
import { useVatModeStore } from '@/shared/model/vat-mode.store';

/**
 * Данные детальной страницы.
 *
 * `useSuspenseQuery`, а не `useQuery`: маршрут уже прогрел кэш через
 * `ensureQueryData` в `loader` (⑱ в route-файле), поэтому к моменту рендера
 * данные точно есть — компоненту не нужно ветвиться на `isPending`.
 *
 * Маппинг в `AuctionDetailVm` идёт здесь, а не в компоненте: пересчёт зависит
 * от режима НДС и должен переиграться при его переключении, но сам DTO
 * компоненту незачем видеть вовсе.
 * @param auctionUuid `order_uid` аукциона.
 * @returns ViewModel детальной страницы.
 */
export const useAuctionDetail = (auctionUuid: string) => {
  const { data } = useSuspenseQuery(auctionDetailQueryOptions(auctionUuid));
  const vatMode = useVatModeStore((state) => state.mode);

  return mapAuctionDetail(data, vatMode);
};
