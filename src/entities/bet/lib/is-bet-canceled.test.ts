import { describe, expect, it } from 'vitest';

import { isBetCanceled } from './is-bet-canceled.util';

describe('isBetCanceled (⑫)', () => {
  it('не отменена: is_rejected false, cancel_reason пустая строка', () => {
    expect(isBetCanceled(false, '')).toBe(false);
  });

  it('отменена по is_rejected при пустой причине', () => {
    expect(isBetCanceled(true, '')).toBe(true);
  });

  it('отменена по непустой cancel_reason при is_rejected: false', () => {
    expect(isBetCanceled(false, 'Отозвана перевозчиком')).toBe(true);
  });

  it('причина из одних пробелов трактуется как пустая (⑫)', () => {
    expect(isBetCanceled(false, '   ')).toBe(false);
  });

  it('undefined источники — не отменена', () => {
    expect(isBetCanceled(undefined, undefined)).toBe(false);
  });

  it('null причина — не отменена сама по себе', () => {
    expect(isBetCanceled(null, null)).toBe(false);
  });
});
