import { useQuery } from '@tanstack/react-query';

import { auctionDetailQueryOptions } from '@/entities/auction';

/**
 * Шаг ставки из уже прогретого кэша детальной — без единого запроса.
 *
 * Задание требует показывать шаг ставки в карточке, но в DTO списка его нет:
 * `AuctionListItemTradingPrice` содержит только `start`, `current` и
 * `current_no_vat`, а `step` живёт исключительно в detail (㉑). Делать ради
 * него запрос на каждую карточку значит устроить N+1 на странице списка.
 *
 * `enabled: false` — ключевая деталь: хук **подписывается** на кэш того же
 * ключа, но сам ничего не грузит. Значит шаг появляется в карточке ровно
 * тогда, когда detail уже прогрет — prefetch'ем по наведению, ссылкой роутера
 * или возвратом с детальной страницы. Пока данных нет, блок шага не
 * рендерится: прочерк на его месте выглядел бы как «шаг равен нулю».
 * @param auctionUuid Идентификатор аукциона из маршрута.
 * @returns Шаг ставки либо `null`, если detail ещё не загружен.
 */
export const useCachedBidStep = (auctionUuid: string): number | null => {
  const { data } = useQuery({ ...auctionDetailQueryOptions(auctionUuid), enabled: false });

  return data?.trading.price?.step ?? null;
};
