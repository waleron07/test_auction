import { useSuspenseQuery } from '@tanstack/react-query';

import { auctionDetailQueryOptions, mapAuctionDetail } from '@/entities/auction';
import { useVatModeStore } from '@/shared/model/vat-mode.store';

/**
 * Данные страницы установки ставки.
 *
 * Читает **и** ViewModel (для подсказок о цене — то же представление, что и
 * на детальной), **и** сырой DTO (для `PlaceBetForm`: границы Zod-схемы
 * сравниваются с базовыми, «с НДС» значениями контракта, ⑧, а не с
 * отформатированной строкой). Оба идут из одного и того же прогретого
 * `loader`'ом ключа (`auctionDetailQueryOptions`) — второго запроса нет,
 * `useSuspenseQuery` с одинаковыми опциями отдаёт закэшированные данные.
 * @param auctionUuid `order_uid` аукциона из маршрута.
 * @returns Сырой DTO и его ViewModel.
 */
export const usePlaceBetPage = (auctionUuid: string) => {
  const { data: detail } = useSuspenseQuery(auctionDetailQueryOptions(auctionUuid));
  const vatMode = useVatModeStore((state) => state.mode);
  const auction = mapAuctionDetail(detail, vatMode);

  return { detail, auction };
};
