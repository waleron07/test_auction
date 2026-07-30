import { describe, expect, it } from 'vitest';

import { type BidMeasurementTypeDto } from '../../api/dto';

import { type PriceUnit, resolvePriceUnit } from './resolve-price-unit.util';

/** Ожидаемая единица «за рейс» целиком — фолбэк обязан быть заполненным. */
const PER_ROUTE_UNIT: PriceUnit = {
  measurement: 'PerRoute',
  priceSuffix: 'за рейс',
  shortLabel: 'за рейс',
};

/** Ожидаемая единица «за км» целиком. */
const PER_KM_UNIT: PriceUnit = {
  measurement: 'PerKm',
  priceSuffix: '/км',
  shortLabel: 'за км',
};

/**
 * Значение, которого в enum'е нет: приходит из расширенной схемы или из
 * пустого поля DTO. Каст локализован здесь и подписан причиной — в самих
 * тестах он читался бы как ошибка типизации.
 */
const outOfEnum = (value: string): BidMeasurementTypeDto => value as BidMeasurementTypeDto;

describe('resolvePriceUnit (㉚)', () => {
  it('PerRoute — цена за рейс', () => {
    expect(resolvePriceUnit('PerRoute')).toEqual(PER_ROUTE_UNIT);
  });

  it('PerKm — цена за километр, и это меняет смысл того же числа', () => {
    expect(resolvePriceUnit('PerKm')).toEqual(PER_KM_UNIT);
  });

  it('Unknown, null и undefined дают полную единицу PerRoute, а не заглушку', () => {
    // Проверяется весь объект: реализация с пустыми `priceSuffix`/`shortLabel`
    // прошла бы проверку одного поля `measurement`, а цена осталась бы без единицы.
    expect(resolvePriceUnit('Unknown')).toEqual(PER_ROUTE_UNIT);
    expect(resolvePriceUnit(null)).toEqual(PER_ROUTE_UNIT);
    expect(resolvePriceUnit(undefined)).toEqual(PER_ROUTE_UNIT);
  });

  it('любое значение вне enum тоже даёт полную единицу PerRoute', () => {
    // Страховка от рефакторинга: сегодняшняя реализация («не PerKm → PerRoute»)
    // безопасна by design, а switch без ветки default — уже нет.
    expect(resolvePriceUnit(outOfEnum(''))).toEqual(PER_ROUTE_UNIT);
    expect(resolvePriceUnit(outOfEnum('SomethingElse'))).toEqual(PER_ROUTE_UNIT);
  });

  it('возвращает стабильную ссылку: единица уходит в пропсы и в deps хуков', () => {
    // Новый объект на каждый вызов ломал бы мемоизацию компонентов цены
    // и подсказок формы, где единица — часть зависимостей.
    expect(resolvePriceUnit('PerRoute')).toBe(resolvePriceUnit('PerRoute'));
    expect(resolvePriceUnit('PerKm')).toBe(resolvePriceUnit('PerKm'));
    expect(resolvePriceUnit(null)).toBe(resolvePriceUnit('Unknown'));
  });

  it('единицы различимы между собой — на этом держится отображение цены', () => {
    expect(resolvePriceUnit('PerRoute').priceSuffix).not.toBe(
      resolvePriceUnit('PerKm').priceSuffix,
    );
  });
});
