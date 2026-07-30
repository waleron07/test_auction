import { describe, expect, it } from 'vitest';

import { selectPrice } from './select-price.util';

describe('selectPrice (⑦㉓)', () => {
  it('режим «с НДС» берёт базовое значение пары', () => {
    expect(selectPrice({ withVat: 36000, noVat: 30000 }, 'with')).toEqual({
      value: 36000,
      usedFallback: false,
    });
  });

  it('режим «без НДС» берёт близнеца `_no_vat`', () => {
    expect(selectPrice({ withVat: 36000, noVat: 30000 }, 'without')).toEqual({
      value: 30000,
      usedFallback: false,
    });
  });

  it('без НДС, но близнеца в проекции нет — отдаёт базовое и помечает фолбэк (㉓)', () => {
    // В списке пара без НДС есть только у `current`; у `start` её нет вовсе,
    // и цену надо показать с явной пометкой, а не спрятать.
    expect(selectPrice({ withVat: 36000, noVat: null }, 'without')).toEqual({
      value: 36000,
      usedFallback: true,
    });
    expect(selectPrice({ withVat: 36000, noVat: undefined }, 'without')).toEqual({
      value: 36000,
      usedFallback: true,
    });
  });

  it('обе половины пары пустые — цены нет, и это не фолбэк (㉛)', () => {
    // `trading.price` в списке nullable целиком: у карточки может не быть
    // блока цены вовсе, и «фолбэк на базовое» тут нечего помечать.
    expect(selectPrice({ withVat: null, noVat: null }, 'with')).toEqual({
      value: null,
      usedFallback: false,
    });
    expect(selectPrice({ withVat: undefined, noVat: undefined }, 'without')).toEqual({
      value: null,
      usedFallback: false,
    });
  });

  it('ноль — значение, а не отсутствие: фолбэк не срабатывает', () => {
    expect(selectPrice({ withVat: 36000, noVat: 0 }, 'without')).toEqual({
      value: 0,
      usedFallback: false,
    });
  });
});
