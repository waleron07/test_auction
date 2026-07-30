import {
  type AuctionListRequestDto,
  type AuctionListResponseDto,
  type AuctionShowResponseDto,
} from '@/shared/api/dto';
import { request } from '@/shared/api/http';

/**
 * Список аукционов. Операция — **POST** с телом фильтров, а не GET с query:
 * фильтров в схеме больше сорока (⑳), и в query они бы не поместились.
 * @param body Тело запроса, собранное из search params страницы списка.
 * @param signal Сигнал отмены от TanStack Query.
 * @returns Страница списка с `meta` для пагинации (⑥).
 */
export const postAuctionsList = (
  body: AuctionListRequestDto,
  signal?: AbortSignal,
): Promise<AuctionListResponseDto> =>
  request<AuctionListResponseDto>('/auctions/list', {
    method: 'POST',
    body,
    ...(signal === undefined ? {} : { signal }),
  });

/**
 * Детальная информация об аукционе.
 * @param auctionUuid `order_uid` аукциона из маршрута (⑱).
 * @param signal Сигнал отмены от TanStack Query.
 * @returns Полное представление аукциона.
 */
export const getAuction = (
  auctionUuid: string,
  signal?: AbortSignal,
): Promise<AuctionShowResponseDto> =>
  request<AuctionShowResponseDto>(`/auctions/${encodeURIComponent(auctionUuid)}`, {
    ...(signal === undefined ? {} : { signal }),
  });
