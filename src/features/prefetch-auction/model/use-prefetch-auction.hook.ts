import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { auctionDetailQueryOptions } from '@/entities/auction';

/**
 * Прогрев кэша детальной страницы по наведению.
 *
 * Дополняет, а не дублирует `defaultPreload: 'intent'` роутера: тот срабатывает
 * на `<Link>`, а карточка — это ещё и тело, по которому пользователь ведёт
 * мышью, не попадая в ссылку. Опции те же самые (`auctionDetailQueryOptions`),
 * поэтому греется тот же ключ, который потом читают и loader, и страница.
 *
 * Прогретый кэш нужен не только ради скорости: из него карточка берёт шаг
 * ставки, которого в DTO списка нет вовсе (㉑).
 * @returns Функция прогрева по `order_uid`.
 */
export const usePrefetchAuction = (): ((auctionUuid: string) => void) => {
  const queryClient = useQueryClient();

  return useCallback(
    (auctionUuid: string) => {
      void queryClient.prefetchQuery(auctionDetailQueryOptions(auctionUuid));
    },
    [queryClient],
  );
};
