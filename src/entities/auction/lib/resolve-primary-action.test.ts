import { describe, expect, it } from 'vitest';

import { type AuctionListItemDto } from '@/shared/api/dto';

import { resolvePrimaryAction } from './resolve-primary-action.util';

const trading = (
  overrides: Partial<NonNullable<AuctionListItemDto['trading']>> = {},
): AuctionListItemDto => ({
  main: { order_uid: 'auction-1001', auc_type: 'Down' },
  trading: {
    status: 'Auction',
    status_mobile: 'NotParticipating',
    can_set_bet: true,
    price: { start: 40_000, current: 36_000, current_no_vat: 30_000 },
    your: { bet: false, last_bet: null },
    ...overrides,
  },
});

describe('resolvePrimaryAction (㉛)', () => {
  it('можно ставить и ставки ещё не было — «Сделать ставку»', () => {
    const action = resolvePrimaryAction(trading());

    expect(action.label).toBe('Сделать ставку');
    expect(action.to).toBe('/auctions/$auctionUuid/bet');
    expect(action.disabled).toBe(false);
  });

  it('своя ставка уже есть — «Изменить ставку»', () => {
    const action = resolvePrimaryAction(trading({ your: { bet: true, last_bet: 35_000 } }));

    expect(action.label).toBe('Изменить ставку');
    expect(action.to).toBe('/auctions/$auctionUuid/bet');
  });

  it('ставки закрыты — «Смотреть ставки», а не отключённая кнопка', () => {
    const action = resolvePrimaryAction(trading({ can_set_bet: false }));

    expect(action.label).toBe('Смотреть ставки');
    expect(action.to).toBe('/auctions/$auctionUuid/bets');
    expect(action.disabled).toBe(false);
  });

  it('данных о торгах нет вовсе — «Смотреть ставки» (㉛)', () => {
    // trading.your === null в списке: карточка обязана предложить хоть что-то.
    const action = resolvePrimaryAction(trading({ your: null, price: null }));

    expect(action.label).toBe('Смотреть ставки');
    expect(action.disabled).toBe(false);
  });

  it('завершённые торги отключают действие и объясняют причину', () => {
    const finished = resolvePrimaryAction(trading({ status: 'Finished', can_set_bet: false }));

    expect(finished.disabled).toBe(true);
    expect(finished.reason).not.toBe('');

    const canceled = resolvePrimaryAction(trading({ status: 'Canceled', can_set_bet: false }));

    expect(canceled.disabled).toBe(true);
    expect(canceled.reason).toContain('отмен');
  });

  it('у отключённого действия всегда есть причина', () => {
    const action = resolvePrimaryAction(trading({ status: 'Stopped', can_set_bet: false }));

    expect(action.disabled).toBe(true);
    expect(action.reason.length).toBeGreaterThan(0);
  });

  it('блока trading нет — карточка всё равно ведёт на ставки', () => {
    const action = resolvePrimaryAction({ main: { order_uid: 'auction-1001' } });

    expect(action.label).toBe('Смотреть ставки');
    expect(action.disabled).toBe(false);
  });
});
