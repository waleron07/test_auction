import { describe, expect, it } from 'vitest';

import { type BetItemDto } from '@/shared/api/dto';
import { NBSP } from '@/shared/lib/string/typography.const';

import { mapBet } from './map-bet.util';

const CURRENT_SUBSCRIBER_ID = 900_100;

const dto = (overrides: Partial<BetItemDto> = {}): BetItemDto => ({
  id: 42,
  created_at: '2026-05-25T16:05:00',
  auction_id: 1236,
  subscriber_id: 13,
  contact_name: 'Иванов Иван',
  contact_phone: '+79001234567',
  price_with_vat: 30_000,
  price_no_vat: 24_590.16,
  organization_id: 14,
  organization_inn: '9616244307',
  organization_name: 'ООО Перевозчик',
  is_rejected: false,
  is_counter: false,
  place: 1,
  is_win: false,
  run_number: 0,
  cancel_reason: '',
  price_info: { vat_rate: '20' },
  ...overrides,
});

describe('mapBet', () => {
  it('выбирает цену с НДС в режиме with', () => {
    const vm = mapBet(dto(), 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.price).toEqual({ text: `30${NBSP}000${NBSP}₽`, isFallback: false });
    expect(vm.vatRate).toBe('20%');
  });

  it('выбирает цену без НДС в режиме without', () => {
    const vm = mapBet(dto(), 'without', CURRENT_SUBSCRIBER_ID);

    expect(vm.price).toEqual({ text: `24${NBSP}590${NBSP}₽`, isFallback: false });
  });

  it('без price_no_vat в режиме without показывает цену с НДС и ставит фолбэк', () => {
    const bet = dto();
    delete bet.price_no_vat;

    const vm = mapBet(bet, 'without', CURRENT_SUBSCRIBER_ID);

    expect(vm.price).toEqual({ text: `30${NBSP}000${NBSP}₽`, isFallback: true });
  });

  it('без vat_rate — прочерк', () => {
    const bet = dto();
    delete bet.price_info;

    const vm = mapBet(bet, 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.vatRate).toBe('—');
  });

  it('своя ставка определяется по subscriber_id', () => {
    const mine = mapBet(
      dto({ subscriber_id: CURRENT_SUBSCRIBER_ID }),
      'with',
      CURRENT_SUBSCRIBER_ID,
    );
    const foreign = mapBet(dto(), 'with', CURRENT_SUBSCRIBER_ID);

    expect(mine.isMine).toBe(true);
    expect(foreign.isMine).toBe(false);
  });

  it('отменённая ставка получает причину, неотменённая — null', () => {
    const canceled = mapBet(
      dto({ cancel_reason: 'Отозвана перевозчиком' }),
      'with',
      CURRENT_SUBSCRIBER_ID,
    );
    const active = mapBet(dto(), 'with', CURRENT_SUBSCRIBER_ID);

    expect(canceled.isCanceled).toBe(true);
    expect(canceled.cancelReason).toBe('Отозвана перевозчиком');
    expect(active.isCanceled).toBe(false);
    expect(active.cancelReason).toBeNull();
  });

  it('is_rejected true без текста причины — причина по умолчанию', () => {
    const vm = mapBet(dto({ is_rejected: true, cancel_reason: '' }), 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.cancelReason).toBe('Причина не указана');
  });

  it('пустые organization_name/inn — прочерк', () => {
    const vm = mapBet(
      dto({ organization_name: '', organization_inn: '' }),
      'with',
      CURRENT_SUBSCRIBER_ID,
    );

    expect(vm.organizationName).toBe('—');
    expect(vm.organizationInn).toBe('—');
  });

  it('place: null остаётся null', () => {
    const vm = mapBet(dto({ place: null }), 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.place).toBeNull();
  });

  it('is_win и is_counter читаются буквально', () => {
    const vm = mapBet(dto({ is_win: true, is_counter: true }), 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.isWin).toBe(true);
    expect(vm.isCounter).toBe(true);
  });

  it('id по умолчанию 0, если не задан', () => {
    const bet = dto();
    delete bet.id;

    const vm = mapBet(bet, 'with', CURRENT_SUBSCRIBER_ID);

    expect(vm.id).toBe(0);
  });
});
