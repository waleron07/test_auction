import { describe, expect, it } from 'vitest';

import { DASH, MINUS, NBSP } from '../string/typography.const';

import { formatMoney } from './format-money.util';

describe('formatMoney', () => {
  it('группирует разряды неразрывным пробелом и ставит ₽', () => {
    expect(formatMoney(30000)).toBe(`30${NBSP}000${NBSP}₽`);
    expect(formatMoney(1234567)).toBe(`1${NBSP}234${NBSP}567${NBSP}₽`);
  });

  it('группирует суммы любой длины', () => {
    expect(formatMoney(1234567890)).toBe(`1${NBSP}234${NBSP}567${NBSP}890${NBSP}₽`);
    expect(formatMoney(100)).toBe(`100${NBSP}₽`);
    expect(formatMoney(1000)).toBe(`1${NBSP}000${NBSP}₽`);
  });

  it('по умолчанию округляет до рублей — копейки в торгах не показываются', () => {
    expect(formatMoney(30000.4)).toBe(`30${NBSP}000${NBSP}₽`);
    expect(formatMoney(30000.6)).toBe(`30${NBSP}001${NBSP}₽`);
  });

  it('ровную половину округляет от нуля — в обе стороны одинаково', () => {
    // Правило halfExpand, как у Intl.NumberFormat: округляется модуль, знак
    // сохраняется. Math.round повёл бы себя иначе (Math.round(-0.5) === -0),
    // и одна и та же сумма выглядела бы по-разному в зависимости от знака.
    expect(formatMoney(30000.5)).toBe(`30${NBSP}001${NBSP}₽`);
    expect(formatMoney(-30000.5)).toBe(`${MINUS}30${NBSP}001${NBSP}₽`);
    expect(formatMoney(1.5)).toBe(`2${NBSP}₽`);
    expect(formatMoney(-0.5)).toBe(`${MINUS}1${NBSP}₽`);
  });

  it('копейки показывает по запросу и округляет до заданного знака', () => {
    expect(formatMoney(199.5, { fractionDigits: 2 })).toBe(`199,50${NBSP}₽`);
    expect(formatMoney(199.456, { fractionDigits: 2 })).toBe(`199,46${NBSP}₽`);
    expect(formatMoney(199.454, { fractionDigits: 2 })).toBe(`199,45${NBSP}₽`);
  });

  it('явный fractionDigits: 0 ведёт себя как режим по умолчанию', () => {
    expect(formatMoney(30000.6, { fractionDigits: 0 })).toBe(`30${NBSP}001${NBSP}₽`);
    expect(formatMoney(30000.6, { fractionDigits: 0 })).toBe(formatMoney(30000.6));
  });

  it('ноль — это цена, а не «не задано»', () => {
    expect(formatMoney(0)).toBe(`0${NBSP}₽`);
  });

  it('у отрицательного нуля минуса не ставит', () => {
    // -0 приходит из арифметики (например, из пересчёта НДС) и означает ноль.
    // «−0 ₽» читалось бы как ошибка расчёта.
    expect(formatMoney(-0)).toBe(`0${NBSP}₽`);
  });

  it('ставит математический минус, а не дефис', () => {
    // U+2212 против U+002D: требование типографики, поэтому проверяется
    // константой, а не символом в исходнике.
    const formatted = formatMoney(-1500);

    expect(formatted).toBe(`${MINUS}1${NBSP}500${NBSP}₽`);
    expect(formatted.startsWith('-')).toBe(false);
  });

  it('null и undefined дают прочерк, а не «NaN ₽»', () => {
    expect(formatMoney(null)).toBe(DASH);
    expect(formatMoney(undefined)).toBe(DASH);
  });

  it('не показывает NaN и бесконечности', () => {
    // Приходят из делений в пересчётах: price_per_km при distance = 0
    // и подобных местах контракта.
    expect(formatMoney(Number.NaN)).toBe(DASH);
    expect(formatMoney(Number.POSITIVE_INFINITY)).toBe(DASH);
    expect(formatMoney(Number.NEGATIVE_INFINITY)).toBe(DASH);
  });
});
