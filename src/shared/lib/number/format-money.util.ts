import { DASH, MINUS, NBSP } from '../string/typography.const';

export interface FormatMoneyOptions {
  /** Знаков после запятой. По умолчанию 0: копейки в торгах не показываются. */
  fractionDigits?: number;
}

/**
 * Форматирует сумму в рублях.
 *
 * Форматирование своё, а не `Intl.NumberFormat`: разделитель разрядов должен
 * быть гарантированно неразрывным пробелом, а вывод — стабильным между
 * версиями ICU, иначе тесты и вёрстка зависят от окружения.
 *
 * **Округление — от нуля (halfExpand):** округляется модуль, знак добавляется
 * после, поэтому `30 000,5 → 30 001` и `−30 000,5 → −30 001` симметричны. Это
 * то же правило, что и у `Intl.NumberFormat` по умолчанию, и осознанно не
 * `Math.round`: тот округляет к плюс бесконечности (`Math.round(-0.5) === -0`),
 * из-за чего одна и та же сумма выглядела бы по-разному в зависимости от знака.
 *
 * Одно отличие от `Intl` намеренно: отрицательный ноль печатается как `0 ₽`, а
 * не `−0 ₽` — минус у нуля читается как ошибка расчёта.
 * @param value Сумма или `null`/`undefined`, если поле контракта не заполнено.
 * @param options Настройки вывода.
 * @returns Строка вида `30 000 ₽` либо `—`, если суммы нет.
 */
export const formatMoney = (
  value: number | null | undefined,
  options: FormatMoneyOptions = {},
): string => {
  if (value === null || value === undefined || !Number.isFinite(value)) return DASH;

  const { fractionDigits = 0 } = options;
  const absolute = Math.abs(value).toFixed(fractionDigits);
  const [integerPart = '0', fractionPart] = absolute.split('.');
  const grouped = integerPart.replaceAll(/\B(?=(\d{3})+(?!\d))/gu, NBSP);
  const sign = value < 0 ? MINUS : '';
  const amount = fractionPart === undefined ? grouped : `${grouped},${fractionPart}`;

  return `${sign}${amount}${NBSP}₽`;
};
