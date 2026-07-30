import { type BetListResponseDto, type SetBetRequestDto } from '@/shared/api/dto';
import { request } from '@/shared/api/http';

export interface GetAuctionBetsParams {
  /** `order_uid` аукциона из маршрута. */
  auctionUuid: string;
  /**
   * Вернуть все ставки, включая отменённые (㉙).
   *
   * Параметр обязателен в сигнатуре, а не опционален: без него отменённые
   * ставки не приходят, и требования задания «признак отменённой ставки» и
   * «причина отмены» становятся недостижимыми — ветка UI осталась бы мёртвой.
   */
  all: boolean;
}

export interface PostAuctionBetParams {
  /** `order_uid` аукциона из маршрута. */
  auctionUuid: string;
  /**
   * Цена ставки. Всегда **с НДС**: это база `current`/`min`/`max`/`step`, а
   * признака НДС тело `SetBetRequest` не содержит вовсе (⑧).
   */
  price: number;
}

/**
 * История ставок аукциона.
 * @param params Идентификатор аукциона и признак `all`.
 * @param signal Сигнал отмены от TanStack Query.
 * @returns `{ bets }` — счётчика участников в ответе нет, он вычисляется (⑬).
 */
export const getAuctionBets = (
  { auctionUuid, all }: GetAuctionBetsParams,
  signal?: AbortSignal,
): Promise<BetListResponseDto> =>
  request<BetListResponseDto>(`/auctions/${encodeURIComponent(auctionUuid)}/bets`, {
    searchParams: { all },
    ...(signal === undefined ? {} : { signal }),
  });

/**
 * Установка ставки.
 *
 * Возвращает `void` намеренно: схема у ответа отсутствует — «ответ
 * проксируется от upstream» (⑨). Опираться на тело нельзя, после успеха
 * обязательна инвалидация list/detail/bets.
 * @param params Идентификатор аукциона и цена.
 * @returns Ничего: результат читается через инвалидацию, а не из ответа.
 */
export const postAuctionBet = async ({
  auctionUuid,
  price,
}: PostAuctionBetParams): Promise<void> => {
  const body: SetBetRequestDto = { price };

  await request<unknown>(`/auctions/${encodeURIComponent(auctionUuid)}/bets`, {
    method: 'POST',
    body,
  });
};
