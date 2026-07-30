import { describe, expect, it } from 'vitest';

import { type AuctionShowResponseDto } from '@/shared/api/dto';

import { mapAuctionPermissions } from './map-auction-permissions.util';

/** Минимальный detail: остальное дописывают тесты через overrides. */
const detail = (overrides: Partial<AuctionShowResponseDto> = {}): AuctionShowResponseDto => ({
  main: {},
  organizer: {},
  contacts: [],
  cargo: {},
  trading: {},
  payment: {},
  assembly: {},
  routes: [],
  admitted_organizations: [],
  ...overrides,
});

describe('mapAuctionPermissions', () => {
  it('оба источника hide_bets_history не заданы — история не скрыта', () => {
    // required-список схемы не включает ни один из двух флагов (㉜): оба могут
    // прийти undefined, и OR из ⑩ обязан дать строгий false, а не undefined.
    expect(mapAuctionPermissions(detail()).hideBetsHistory).toBe(false);
  });

  it('история скрыта, если true в корне', () => {
    expect(mapAuctionPermissions(detail({ hide_bets_history: true })).hideBetsHistory).toBe(true);
  });

  it('история скрыта, если true в trading, даже когда корень молчит (⑩)', () => {
    const withTradingFlag = detail({ trading: { hide_bets_history: true } });

    expect(mapAuctionPermissions(withTradingFlag).hideBetsHistory).toBe(true);
  });

  it('явный false в обоих источниках — история не скрыта', () => {
    // Отдельно от случая «оба не заданы»: `=== true` обязан одинаково отвергать
    // и `undefined`, и явный `false`. Мутация на `!== undefined` прошла бы тест
    // с `undefined`, но не пройдёт этот.
    const explicitFalse = detail({
      hide_bets_history: false,
      trading: { hide_bets_history: false },
    });

    expect(mapAuctionPermissions(explicitFalse).hideBetsHistory).toBe(false);
  });

  it('can_set_bet отражает поле trading без искажений', () => {
    expect(mapAuctionPermissions(detail({ trading: { can_set_bet: true } })).canSetBet).toBe(true);
    expect(mapAuctionPermissions(detail({ trading: { can_set_bet: false } })).canSetBet).toBe(
      false,
    );
    expect(mapAuctionPermissions(detail()).canSetBet).toBe(false);
  });

  it('hide_places берётся из схемы (⑭)', () => {
    expect(mapAuctionPermissions(detail({ trading: { hide_places: true } })).hidePlaces).toBe(true);
    expect(mapAuctionPermissions(detail()).hidePlaces).toBe(false);
  });

  it('hide_points_address_and_contacts переносится как есть (㉗)', () => {
    const hidden = detail({ trading: { hide_points_address_and_contacts: true } });

    expect(mapAuctionPermissions(hidden).hidePointsAddressAndContacts).toBe(true);
  });

  it('no_view_cargo_price переносится как есть', () => {
    expect(
      mapAuctionPermissions(detail({ trading: { no_view_cargo_price: true } })).noViewCargoPrice,
    ).toBe(true);
  });

  it('организатор на детальной не скрывается никогда: у AuctionShowOrganizer нет такого флага (㉖)', () => {
    // Асимметрия контракта: is_hide_organization есть только в списке.
    // Это следствие схемы, а не недосмотр, и зафиксировано явным false.
    expect(mapAuctionPermissions(detail()).hideOrganization).toBe(false);
  });
});
