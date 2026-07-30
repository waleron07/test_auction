/**
 * Цвет бейджа. Совпадает с палитрой MUI `Chip`, но объявлен своим типом:
 * `shared/lib` не должен зависеть от библиотеки компонентов — словари читают
 * и мапперы, и тесты, где MUI не нужен.
 */
export type BadgeColor =
  'default' | 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info';

export interface EnumEntry {
  /** Русский лейбл для UI. */
  label: string;
  /** Цвет бейджа. */
  color: BadgeColor;
}

/**
 * Словарь «значение enum → лейбл и цвет». Обязан покрывать **все** значения
 * enum'а, включая `Unknown`: во всех enum'ах схемы он есть, и любой `switch`
 * без ветки по умолчанию — потенциальный пустой бейдж (④).
 */
export type EnumDict<TValue extends string> = Record<TValue, EnumEntry>;
