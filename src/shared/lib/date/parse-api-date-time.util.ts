import { isValid, parseISO } from 'date-fns';

/**
 * Время ответа без смещения: `2026-05-25T16:03:00`, `...T16:03`, `...:00.123`.
 * Ровно эта форма приходит в `start_time`, `stop_time`, `created_at` (⑮).
 */
const LOCAL_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?$/;

/**
 * Та же дата, но со смещением. Контракт такого в ответах не обещает; форма
 * принимается на случай, если бэкенд начнёт присылать смещение — отбрасывать
 * его было бы хуже, чем учесть.
 */
const OFFSET_DATE_TIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?([+-]\d{2}:\d{2}|Z)$/;

/**
 * Разбирает дату из ответа API как локальное время.
 *
 * `parseISO` из date-fns трактует строку без смещения как локальную — в отличие
 * от `new Date(...)`, поведение которого зависит от формы ISO-строки. Формы
 * перечислены явными регулярками, а не «всё, что разобралось»: дата без времени
 * (`2026-05-25`) для полей этого контракта — признак неожиданного формата, а не
 * полночь. Молча подставленная полночь сдвинула бы отображаемое время суток.
 * @param value Значение из DTO: строка, `null` или отсутствующее поле.
 * @returns Дата либо `null`, если значение пустое, не той формы или невозможное.
 */
export const parseApiDateTime = (value: string | null | undefined): Date | null => {
  if (value === null || value === undefined) return null;

  const trimmed = value.trim();

  if (trimmed === '') return null;

  if (!LOCAL_DATE_TIME.test(trimmed) && !OFFSET_DATE_TIME.test(trimmed)) return null;

  const parsed = parseISO(trimmed);

  // Невозможные даты («2026-02-31») проходят регулярку, но не календарь.
  return isValid(parsed) ? parsed : null;
};
