import { describe, expect, it } from 'vitest';

import { DASH, NBSP } from '../string/typography.const';

import { formatMoney } from './format-money.util';
import { formatPrice } from './format-price.util';
import { resolvePriceUnit } from './resolve-price-unit.util';

describe('formatPrice (㉚)', () => {
  it('за рейс: единица идёт словами после суммы', () => {
    expect(formatPrice(30000, resolvePriceUnit('PerRoute'))).toBe(
      `30${NBSP}000${NBSP}₽${NBSP}за рейс`,
    );
  });

  it('за км: единица приклеена к рублю, как в «199 ₽/км»', () => {
    expect(formatPrice(199, resolvePriceUnit('PerKm'))).toBe(`199${NBSP}₽/км`);
  });

  it('одно и то же число даёт разные суффиксы — в этом и суть единицы', () => {
    // Проверяются конкретные строки, а не только их неравенство: «199 ₽ рейс»
    // против «199 ₽/км» тоже были бы не равны, но формат был бы сломан.
    expect(formatPrice(199, resolvePriceUnit('PerRoute'))).toBe(`199${NBSP}₽${NBSP}за рейс`);
    expect(formatPrice(199, resolvePriceUnit('PerKm'))).toBe(`199${NBSP}₽/км`);
  });

  it('форматирование суммы делегируется formatMoney, а не собирается заново', () => {
    // Ключевая защита от «упрощения» до `${value} ₽ ${unit}`: тесты на единицы
    // такое пропустили бы, а группировка разрядов и округление сломались бы.
    const value = 30000.6;

    expect(formatPrice(value, resolvePriceUnit('PerRoute'))).toBe(
      `${formatMoney(value)}${NBSP}за рейс`,
    );
    expect(formatPrice(value, resolvePriceUnit('PerRoute'))).toBe(
      `30${NBSP}001${NBSP}₽${NBSP}за рейс`,
    );
  });

  it('за км группировка разрядов тоже сохраняется', () => {
    expect(formatPrice(30000, resolvePriceUnit('PerKm'))).toBe(`30${NBSP}000${NBSP}₽/км`);
    expect(formatPrice(1234567, resolvePriceUnit('PerKm'))).toBe(
      `1${NBSP}234${NBSP}567${NBSP}₽/км`,
    );
  });

  it('без цены — прочерк без единицы: «— за рейс» читается как ошибка', () => {
    expect(formatPrice(null, resolvePriceUnit('PerRoute'))).toBe(DASH);
    expect(formatPrice(undefined, resolvePriceUnit('PerKm'))).toBe(DASH);
    expect(formatPrice(Number.NaN, resolvePriceUnit('PerKm'))).toBe(DASH);
  });
});
