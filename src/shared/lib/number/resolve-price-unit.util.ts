// Внутри слоя shared — относительный импорт: алиас `@/shared/*` запрещён
// правилом границ FSD (слой не импортирует сам себя через публичный путь).
import { type BidMeasurementTypeDto } from '../../api/dto';

export interface PriceUnit {
  /**
   * Нормализованная единица: `Unknown`, `null` и незнакомые значения схемы
   * приведены к `PerRoute` — здесь их уже нет.
   */
  measurement: 'PerRoute' | 'PerKm';
  /** Хвост цены: `30 000 ₽ за рейс` против `199 ₽/км`. */
  priceSuffix: string;
  /** Короткая форма для подсказок и подписей полей. */
  shortLabel: string;
}

const PER_ROUTE: PriceUnit = {
  measurement: 'PerRoute',
  priceSuffix: 'за рейс',
  shortLabel: 'за рейс',
};

const PER_KM: PriceUnit = { measurement: 'PerKm', priceSuffix: '/км', shortLabel: 'за км' };

/**
 * Определяет, что означает число в `price.current` и `price.step`:
 * цену за рейс или за километр (㉚).
 *
 * Игнорировать `bid_measurement_type` нельзя — при `PerKm` то же число значит
 * другое, и задание отдельным пунктом требует показывать цену за км. Единица
 * возвращается объектом, а не строкой, потому что она нужна сразу в трёх
 * местах: в отображении цены, в подсказках формы ставки и в сообщениях Zod.
 *
 * `Unknown` и `null` трактуются как `PerRoute` — принятое допущение, зафиксировано
 * в README: базовый случай контракта, при котором цена относится ко всему рейсу.
 *
 * Возвращаются **две константы, а не новые объекты**: результат попадает в пропсы
 * компонентов и в списки зависимостей хуков, где новая ссылка на каждый рендер
 * ломала бы мемоизацию. Стабильность ссылки — требование, а не оптимизация,
 * и она зафиксирована тестом.
 * @param value Значение `bid_measurement_type` из списка или detail.
 * @returns Одна из двух константных единиц измерения цены.
 */
export const resolvePriceUnit = (value: BidMeasurementTypeDto | null | undefined): PriceUnit =>
  value === 'PerKm' ? PER_KM : PER_ROUTE;
