import { describe, expect, it } from 'vitest';

import { NBSP } from '../string/typography.const';

import { toNumber } from './to-number.util';

describe('toNumber (㉕)', () => {
  it('число пропускает как есть', () => {
    expect(toNumber(1200.5)).toBe(1200.5);
    expect(toNumber(0)).toBe(0);
  });

  it('строковые числа схемы приводит к number', () => {
    // RoutePointCargo.weight, AuctionShowCargo.price — в схеме строки.
    expect(toNumber('1200.50')).toBe(1200.5);
    expect(toNumber('20')).toBe(20);
    expect(toNumber('30000.00')).toBe(30000);
    expect(toNumber('0')).toBe(0);
  });

  it('«1.000» из схемы — это одна тонна, а не тысяча', () => {
    // Пример прямо из контракта: RoutePointCargo.weight = "1.000" с описанием
    // «строковое представление с 3 знаками». Точка здесь десятичная, и попытка
    // «починить» разбор трактовкой точки как разделителя разрядов превратила бы
    // рейс на 1 т в рейс на 1000 т.
    expect(toNumber('1.000')).toBe(1);
    expect(toNumber('20.500')).toBe(20.5);
  });

  it('терпит разделители, которыми бэкенд может украсить строку', () => {
    expect(toNumber('1 200,50')).toBe(1200.5);
    expect(toNumber('1 200.50')).toBe(1200.5);
    expect(toNumber(`1${NBSP}200,50`)).toBe(1200.5);
  });

  it('разбирает несколько групп разрядов — формат, приходящий из UI', () => {
    expect(toNumber('1 234 567,89')).toBe(1234567.89);
  });

  it('понимает смешанные пробельные разделители в одной строке', () => {
    expect(toNumber(`1${NBSP}234 567,89`)).toBe(1234567.89);
  });

  it('понимает явный плюс', () => {
    expect(toNumber('+1200')).toBe(1200);
    expect(toNumber('+1 200,50')).toBe(1200.5);
  });

  it('понимает знак: корректировки приходят отрицательными', () => {
    expect(toNumber('-1 200,50')).toBe(-1200.5);
    expect(toNumber(-1200.5)).toBe(-1200.5);
  });

  it('«не задано» во всех видах даёт null', () => {
    expect(toNumber('')).toBeNull();
    expect(toNumber('   ')).toBeNull();
    expect(toNumber(NBSP)).toBeNull();
    expect(toNumber(null)).toBeNull();
    expect(toNumber(undefined)).toBeNull();
  });

  it('управляющие пробелы — тоже «не задано»', () => {
    // `\s` в регулярке нормализации покрывает их намеренно: перевод строки
    // внутри значения приходит из выгрузок и из копипаста.
    expect(toNumber('\n\t')).toBeNull();
    expect(toNumber('\n1200\t')).toBe(1200);
  });

  it('неоднозначный формат отклоняет, а не угадывает', () => {
    // '1,234,56' — два разделителя разных смыслов в одной строке. Здесь важно
    // именно вернуть null: «умный» разбор дал бы 123456 или 1.23456, и оба
    // варианта — молча искажённая цена.
    expect(toNumber('1,234,56')).toBeNull();
  });

  it('строки «null» и «undefined» — не числа и не пустота', () => {
    // Отдельный кейс: это текст, который бэкенд иногда присылает вместо null,
    // и превратить его в 0 было бы худшим исходом.
    expect(toNumber('null')).toBeNull();
    expect(toNumber('undefined')).toBeNull();
  });

  it('нечисловую строку и NaN превращает в null, а не в 0', () => {
    // Ноль здесь был бы худшим вариантом: «0 ₽» выглядит как настоящая цена.
    expect(toNumber('около 20 тонн')).toBeNull();
    expect(toNumber(Number.NaN)).toBeNull();
  });

  it('бесконечности отбрасывает в обе стороны', () => {
    expect(toNumber(Number.POSITIVE_INFINITY)).toBeNull();
    expect(toNumber(Number.NEGATIVE_INFINITY)).toBeNull();
    expect(toNumber('Infinity')).toBeNull();
  });
});
