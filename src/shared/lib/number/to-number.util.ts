/**
 * Приводит числовое поле контракта к `number`.
 *
 * Одни и те же величины схема отдаёт по-разному: `AuctionListItemCargo.weight` —
 * `number`, а `RoutePointCargo.weight` и `AuctionShowCargo.price` — `string`
 * (㉕). Нормализация живёт на границе маппера, чтобы дальше по коду вес был
 * весом, а не «строкой или числом».
 *
 * Возврат `null`, а не `0`, — намеренно: ноль выглядит как настоящая цена или
 * настоящий вес, и «0 ₽» в карточке неотличим от бесплатного рейса.
 * @param value Значение из DTO: число, строка, `null` или отсутствующее поле.
 * @returns Число либо `null`, если значение не задано или не разбирается.
 */
export const toNumber = (value: number | string | null | undefined): number | null => {
  if (value === null || value === undefined) return null;

  if (typeof value === 'number') return Number.isFinite(value) ? value : null;

  // Пробелы-разделители разрядов и запятая как десятичный разделитель — то,
  // чем бэкенд может украсить строковое число. Класс `\s` в JS покрывает и
  // неразрывный пробел, поэтому писать его символом не нужно.
  const normalized = value.replaceAll(/\s/gu, '').replace(',', '.');
  if (normalized === '') return null;

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
};
