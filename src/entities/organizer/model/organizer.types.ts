/**
 * Организатор и его контакты.
 *
 * Объявлены заново, а не импортированы из `entities/auction`: сущности одного
 * уровня FSD не имеют права ссылаться друг на друга — только через `pages`
 * или `widgets`, которые стоят выше обеих. Совпадение формы с
 * `AuctionDetailVm.organizer`/`.contacts` не случайно: оба описывают один и тот
 * же кусок ответа `GET /auctions/{auctionUuid}`, но каждая сущность видит его
 * своими глазами.
 */
export interface OrganizerVm {
  name: string;
  inn: string;
}

/** Контакт организатора: все поля схемы `Contact` nullable. */
export interface ContactVm {
  name: string;
  phone: string;
  email: string;
}
