import { format, isSameDay } from 'date-fns';
import { ru } from 'date-fns/locale';

import { DASH } from '../string/typography.const';

import { parseApiDateTime } from './parse-api-date-time.util';

/** Дата с временем внутри текущего года: «26 мая, 10:00». */
const DATE_TIME = 'd MMMM, HH:mm';

/** То же с годом: «26 мая 2027, 10:00». */
const DATE_TIME_WITH_YEAR = 'd MMMM yyyy, HH:mm';

/** Только время: вторая граница того же дня. */
const TIME_ONLY = 'HH:mm';

/**
 * Год показывается только тогда, когда он отличается от текущего.
 *
 * Торги идут в пределах недель, поэтому год в каждой дате — шум. Но погрузка
 * может приходиться на следующий год (декабрьский аукцион с загрузкой в
 * январе), и «26 мая» без года в такой ситуации означает не ту дату.
 * @param date Форматируемая дата.
 * @param now Текущий момент — передаётся, а не берётся внутри, чтобы обе
 * границы диапазона сравнивались с одним и тем же годом.
 * @returns Шаблон формата даты.
 */
const patternFor = (date: Date, now: Date): string =>
  date.getFullYear() === now.getFullYear() ? DATE_TIME : DATE_TIME_WITH_YEAR;

/**
 * Форматирует интервал дат для карточки и детальной страницы.
 *
 * Три правила, каждое из которых решает свою проблему чтения:
 *
 * 1. **Диапазон в один день не повторяет дату дважды**: «26 мая, 10:00 → 18:00»
 *    вместо «26 мая, 10:00 → 26 мая, 18:00» — иначе читателю приходится
 *    сравнивать две строки, чтобы понять, что это один день.
 * 2. **Год появляется только когда он не текущий** — см. `patternFor`.
 * 3. **Порядок границ не меняется.** Если пришло «27 мая → 26 мая», так и
 *    печатается: это данные сервера, и молчаливая перестановка скрыла бы
 *    ошибку в них.
 *
 * Разбор идёт через `parseApiDateTime`, поэтому naive-время ответа (⑮) не
 * сдвигается на смещение зоны.
 * @param from Начало интервала.
 * @param to Конец интервала.
 * @returns Человеческая строка либо прочерк, если дат нет.
 */
export const formatDateRange = (
  from: string | null | undefined,
  to: string | null | undefined,
): string => {
  const start = parseApiDateTime(from);
  const end = parseApiDateTime(to);
  const now = new Date();

  // Задана одна граница или ни одной — стрелки нет.
  if (start === null) {
    return end === null ? DASH : format(end, patternFor(end, now), { locale: ru });
  }

  if (end === null || start.getTime() === end.getTime()) {
    return format(start, patternFor(start, now), { locale: ru });
  }

  const endPattern = isSameDay(start, end) ? TIME_ONLY : patternFor(end, now);

  return `${format(start, patternFor(start, now), { locale: ru })} → ${format(end, endPattern, { locale: ru })}`;
};
