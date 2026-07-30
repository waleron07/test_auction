import { type EnumDict, type EnumEntry } from './enum-dict.types';

/** Значение по умолчанию: во всех enum'ах схемы есть `Unknown` (④). */
const UNKNOWN_KEY = 'Unknown';

const FALLBACK: EnumEntry = { label: 'Неизвестно', color: 'default' };

/**
 * Достаёт запись словаря по значению enum с фолбэком на `Unknown`.
 *
 * Прямое `dict[value]` запрещено правилом ④, и не из вкусовых соображений:
 * `TradingStatus` объявлен девятью значениями в общей схеме и шестью в
 * инлайновом `status_mobile` (③), а `noUncheckedIndexedAccess` делает результат
 * индексации `EnumEntry | undefined`. Незнакомое значение обязано
 * деградировать до «Неизвестно», а не рисовать пустой бейдж.
 * @param dict Словарь enum'а.
 * @param value Значение из DTO: может быть `null`, `undefined` или вне enum'а.
 * @returns Запись словаря, либо запись `Unknown`, либо общий фолбэк.
 */
export const getEnumEntry = <TValue extends string>(
  dict: EnumDict<TValue>,
  value: string | null | undefined,
): EnumEntry => {
  if (value !== null && value !== undefined) {
    const entry: EnumEntry | undefined = (dict as Record<string, EnumEntry | undefined>)[value];

    if (entry !== undefined) return entry;
  }

  return (dict as Record<string, EnumEntry | undefined>)[UNKNOWN_KEY] ?? FALLBACK;
};

/**
 * Лейбл значения enum с тем же фолбэком, что и `getEnumEntry`.
 * @param dict Словарь enum'а.
 * @param value Значение из DTO.
 * @returns Русский лейбл для UI.
 */
export const getEnumLabel = <TValue extends string>(
  dict: EnumDict<TValue>,
  value: string | null | undefined,
): string => getEnumEntry(dict, value).label;
