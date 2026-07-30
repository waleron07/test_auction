import { type AuctionShowResponseDto } from '@/shared/api/dto';

/**
 * Шесть флагов ограничений, свёрнутых в один объект.
 *
 * Ни один компонент не читает сырые флаги DTO напрямую — только этот объект:
 * иначе формула ⑩ (два источника `hide_bets_history`) продублировалась бы в
 * каждом месте, которое хочет знать, скрыта ли история, и однажды разошлась бы.
 */
export interface AuctionPermissions {
  /** `trading.can_set_bet` — доступность формы ставки (⑧). */
  canSetBet: boolean;
  /** Скрыта ли история ставок: `true` в любом из двух источников (⑩). */
  hideBetsHistory: boolean;
  /** Скрыты ли места в рейтинге ставок (⑭). */
  hidePlaces: boolean;
  /** Скрыты ли адрес и контакт точки маршрута (㉗). */
  hidePointsAddressAndContacts: boolean;
  /** Скрыта ли цена груза. */
  noViewCargoPrice: boolean;
  /** Скрыт ли организатор. На детальной всегда `false` — см. ниже. */
  hideOrganization: boolean;
}

/**
 * Сворачивает шесть флагов-ограничений DTO в один объект.
 *
 * `hideBetsHistory` — единственное поле с настоящей логикой: флаг лежит и в
 * корне ответа, и в `trading`, оба optional (㉜), и скрытым история считается,
 * если `true` хотя бы в одном источнике. Прямое `a || b` дало бы
 * `boolean | undefined`, а не строгий `boolean`, поэтому сравнение с `true`
 * обязательно на каждом источнике.
 *
 * `hideOrganization` — единственное поле с фиксированным значением на этой
 * странице. Флаг `is_hide_organization` существует только в проекции списка;
 * `AuctionShowOrganizer` его не содержит вовсе (㉖). Организатор на детальной
 * показывается всегда — это следствие контракта, а не недосмотр, и `false`
 * здесь зафиксирован явно, чтобы решение не потерялось при чтении кода.
 * @param detail Ответ `GET /auctions/{auctionUuid}`.
 * @returns Объект ограничений для всех компонентов детальной страницы.
 */
export const mapAuctionPermissions = (detail: AuctionShowResponseDto): AuctionPermissions => ({
  canSetBet: detail.trading.can_set_bet === true,
  hideBetsHistory: detail.hide_bets_history === true || detail.trading.hide_bets_history === true,
  hidePlaces: detail.trading.hide_places === true,
  hidePointsAddressAndContacts: detail.trading.hide_points_address_and_contacts === true,
  noViewCargoPrice: detail.trading.no_view_cargo_price === true,
  hideOrganization: false,
});
