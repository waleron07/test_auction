import { describe, expect, it } from 'vitest';

import { type AuctionShowTradingPriceDto } from '@/shared/api/dto';

import { createBetSchema } from './create-bet-schema.util';

const price = (
  overrides: Partial<AuctionShowTradingPriceDto> = {},
): AuctionShowTradingPriceDto => ({
  min: 20_000,
  max: 30_000,
  current: 25_000,
  step: 500,
  available: 25_000,
  ...overrides,
});

const parse = (
  value: unknown,
  priceLimits: AuctionShowTradingPriceDto | undefined,
  aucType: Parameters<typeof createBetSchema>[1] = 'Request',
  bidMeasurementType: Parameters<typeof createBetSchema>[2] = null,
) => createBetSchema(priceLimits, aucType, bidMeasurementType).safeParse({ price: value });

describe('createBetSchema — базовое требование схемы (⑧)', () => {
  it('ноль отклоняется', () => {
    expect(parse(0, price()).success).toBe(false);
  });

  it('отрицательное число отклоняется', () => {
    expect(parse(-500, price()).success).toBe(false);
  });

  it('не число отклоняется', () => {
    expect(parse('abc', price()).success).toBe(false);
  });

  it('положительное число внутри всех ограничений принимается', () => {
    expect(parse(25_500, price()).success).toBe(true);
  });
});

describe('createBetSchema — min/max (⑦: применяются, только если поле не null)', () => {
  it('цена ниже min отклоняется', () => {
    expect(parse(19_999, price()).success).toBe(false);
  });

  it('цена равная min принимается (граница)', () => {
    expect(parse(20_000, price()).success).toBe(true);
  });

  it('цена выше max отклоняется', () => {
    expect(parse(30_001, price()).success).toBe(false);
  });

  it('цена равная max принимается (граница)', () => {
    expect(parse(30_000, price()).success).toBe(true);
  });

  it('min: null снимает нижнее ограничение', () => {
    expect(parse(100, price({ min: null, step: null })).success).toBe(true);
  });

  it('max: null снимает верхнее ограничение', () => {
    expect(parse(1_000_000, price({ max: null, step: null })).success).toBe(true);
  });
});

describe('createBetSchema — кратность шагу', () => {
  it('некратное шагу значение отклоняется', () => {
    expect(parse(20_250, price()).success).toBe(false);
  });

  it('кратное шагу значение принимается', () => {
    expect(parse(20_500, price()).success).toBe(true);
  });

  it('step: null снимает ограничение кратности', () => {
    expect(parse(20_123, price({ step: null })).success).toBe(true);
  });

  it('step <= 0 трактуется как отсутствие ограничения, а не как ошибка данных', () => {
    expect(parse(20_123, price({ step: -500 })).success).toBe(true);
  });
});

describe('createBetSchema — направление по типу аукциона', () => {
  it('Down: цена ниже current принимается', () => {
    expect(parse(24_500, price({ min: null, max: null, step: null }), 'Down').success).toBe(true);
  });

  it('Down: цена не ниже current отклоняется', () => {
    expect(parse(25_000, price({ min: null, max: null, step: null }), 'Down').success).toBe(false);
  });

  it('Up: цена выше current принимается', () => {
    expect(parse(25_500, price({ min: null, max: null, step: null }), 'Up').success).toBe(true);
  });

  it('Up: цена не выше current отклоняется', () => {
    expect(parse(25_000, price({ min: null, max: null, step: null }), 'Up').success).toBe(false);
  });

  it('FixPrice: точное совпадение с available принимается', () => {
    expect(
      parse(25_000, price({ min: null, max: null, step: null, available: 25_000 }), 'FixPrice')
        .success,
    ).toBe(true);
  });

  it('FixPrice: любое отклонение от available отклоняется', () => {
    expect(
      parse(25_500, price({ min: null, max: null, step: null, available: 25_000 }), 'FixPrice')
        .success,
    ).toBe(false);
  });

  it('FixPrice: available: null — сравнение идёт с current', () => {
    expect(
      parse(25_000, price({ min: null, max: null, step: null, available: null }), 'FixPrice')
        .success,
    ).toBe(true);
  });

  it('Request: направление не ограничено даже при заданном current', () => {
    expect(parse(1, price({ min: null, max: null, step: null }), 'Request').success).toBe(true);
  });

  it('Unknown: направление не ограничено', () => {
    expect(parse(1, price({ min: null, max: null, step: null }), 'Unknown').success).toBe(true);
  });
});

describe('createBetSchema — все ограничения null', () => {
  it('любая положительная цена принимается', () => {
    const empty: AuctionShowTradingPriceDto = {
      min: null,
      max: null,
      current: null,
      step: null,
      available: null,
    };

    expect(parse(42, empty, 'Down').success).toBe(true);
  });

  it('price: undefined целиком (блок торгов не пришёл) не ломает схему', () => {
    expect(parse(42, undefined, 'Down').success).toBe(true);
  });
});
