import { describe, expect, it } from 'vitest';

import { type BetItemDto } from '@/shared/api/dto';

import { countBetParticipants } from './count-bet-participants.util';

const bet = (overrides: Partial<BetItemDto>): BetItemDto => ({
  organization_id: 1,
  is_rejected: false,
  cancel_reason: '',
  ...overrides,
});

describe('countBetParticipants (⑬)', () => {
  it('пустой список — ноль участников', () => {
    expect(countBetParticipants([])).toBe(0);
  });

  it('считает уникальные organization_id', () => {
    const bets = [
      bet({ organization_id: 1 }),
      bet({ organization_id: 2 }),
      bet({ organization_id: 1 }),
    ];

    expect(countBetParticipants(bets)).toBe(2);
  });

  it('отменённые ставки не делают организацию участником', () => {
    const bets = [
      bet({ organization_id: 1 }),
      bet({ organization_id: 2, is_rejected: true }),
      bet({ organization_id: 3, cancel_reason: 'Отозвана' }),
    ];

    expect(countBetParticipants(bets)).toBe(1);
  });

  it('организация с и отменённой, и активной ставкой считается один раз', () => {
    const bets = [bet({ organization_id: 1 }), bet({ organization_id: 1, is_rejected: true })];

    expect(countBetParticipants(bets)).toBe(1);
  });

  it('ставка без organization_id не учитывается', () => {
    const noOrg = bet({});
    delete noOrg.organization_id;

    expect(countBetParticipants([noOrg])).toBe(0);
  });
});
