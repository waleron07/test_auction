import { DASH, NBSP } from '../string/typography.const';

import { formatMoney } from './format-money.util';
import { type PriceUnit } from './resolve-price-unit.util';

/**
 * Собирает цену с единицей измерения: `30 000 ₽ за рейс` или `199 ₽/км` (㉚).
 *
 * Единица — часть цены, а не отдельный бейдж рядом: «199 ₽» без пометки «/км»
 * читается как цена рейса и вводит в заблуждение сильнее, чем отсутствие цены.
 * @param value Сумма из `price.current` / `price.step` или `null`.
 * @param unit Единица измерения из `resolvePriceUnit`.
 * @returns Отформатированная цена либо `—`, если суммы нет.
 */
export const formatPrice = (value: number | null | undefined, unit: PriceUnit): string => {
  const money = formatMoney(value);

  // Прочерк остаётся прочерком: «— за рейс» выглядит как сбой вёрстки.
  if (money === DASH) return money;

  return unit.measurement === 'PerKm'
    ? `${money}${unit.priceSuffix}`
    : `${money}${NBSP}${unit.priceSuffix}`;
};
