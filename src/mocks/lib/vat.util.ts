/**
 * Ставка НДС моков, %. В контракте она приходит строкой в
 * `BetItemPriceInfo.vat_rate`, поэтому строковая форма выводится отсюда же.
 */
export const VAT_RATE = 20;

/** Строковая форма ставки для полей DTO. */
export const VAT_RATE_LABEL = String(VAT_RATE);

/** Множитель пересчёта «с НДС → без НДС». */
export const VAT_MULTIPLIER = 1 + VAT_RATE / 100;

/**
 * Округляет до копеек.
 * @param value Сумма.
 * @returns Сумма с двумя знаками после запятой.
 */
export const roundKopecks = (value: number): number => Math.round(value * 100) / 100;

/**
 * Убирает НДС из суммы.
 *
 * Живёт в одном месте, а не по копии в сиде и мутаторе: расхождение ставки или
 * округления дало бы мок, в котором `price_no_vat` не соответствует `vat_rate`
 * в том же объекте — то есть мок, противоречащий сам себе (⑧).
 * @param value Сумма с НДС.
 * @returns Сумма без НДС, округлённая до копеек.
 */
export const noVat = (value: number): number => roundKopecks(value / VAT_MULTIPLIER);

/**
 * Цена за километр по сумме без НДС.
 * @param priceNoVat Сумма без НДС.
 * @param distance Расстояние, км.
 * @returns Цена за км; при нулевом или неизвестном расстоянии — 0 (⑦).
 */
export const pricePerKm = (priceNoVat: number, distance: number | null): number =>
  distance === null || distance === 0 ? 0 : roundKopecks(priceNoVat / distance);

/**
 * Следующая допустимая цена: шаг в сторону торгов.
 * @param price Текущая цена.
 * @param step Шаг ставки; `null` или неположительный означает «шага нет».
 * @param aucType Тип аукциона: на повышение шаг прибавляется, иначе вычитается.
 * @returns Цена, доступная для следующей ставки.
 */
export const nextAvailablePrice = (price: number, step: number | null, aucType: string): number => {
  if (step === null || step <= 0) return price;

  return aucType === 'Up' ? price + step : price - step;
};
