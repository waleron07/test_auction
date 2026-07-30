import { type AuctionListRequestDto } from './dto';

/**
 * Единая иерархия ключей запросов. Ключи собираются здесь, а не в местах
 * использования: у списка, detail и ставок по четыре потребителя каждый
 * (компонент, loader маршрута, prefetch по hover, инвалидация после ставки), и
 * разошедшийся ключ означает второй кэш вместо прогретого первого.
 *
 * Иерархия построена на префиксах, чтобы инвалидация после ставки била одним
 * вызовом по всему поддереву аукциона.
 */
export const auctionKeys = {
  /** Корень: инвалидация всего, что связано с аукционами. */
  all: () => ['auctions'] as const,

  /**
   * Список. Тело запроса — часть ключа целиком: фильтры и страница меняют
   * ответ, а значит должны менять и ключ.
   * @param request Тело `POST /auctions/list`.
   * @returns Ключ запроса списка.
   */
  list: (request: AuctionListRequestDto) => ['auctions', 'list', request] as const,

  /**
   * Детальная информация об аукционе.
   * @param auctionUuid `order_uid` из маршрута (⑱).
   * @returns Ключ запроса detail.
   */
  detail: (auctionUuid: string) => ['auctions', 'detail', auctionUuid] as const,

  /**
   * Ставки аукциона. Параметр `all` входит в ключ обязательно (㉙): ответы с
   * отменёнными ставками и без них — разные данные, и в одном кэше они
   * затирали бы друг друга.
   *
   * Вызов без параметров даёт **префикс** — им инвалидируются сразу оба
   * варианта после успешной ставки.
   * @param auctionUuid `order_uid` из маршрута.
   * @param params Параметры запроса ставок.
   * @returns Ключ или префикс ключа запроса ставок.
   */
  bets: (auctionUuid: string, params?: { all: boolean }) =>
    params === undefined
      ? (['auctions', 'detail', auctionUuid, 'bets'] as const)
      : (['auctions', 'detail', auctionUuid, 'bets', params] as const),
};
