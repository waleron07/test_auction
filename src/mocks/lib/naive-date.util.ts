/**
 * Форматирует дату так, как её отдаёт этот API: **без смещения** (⑮).
 *
 * `toISOString` здесь неприменим — он даёт UTC и хвост `Z`, которых в ответах
 * контракта нет. Мок, отдающий смещение, скрыл бы от клиента ровно ту
 * асимметрию, ради которой в проекте два разных хелпера дат.
 * @param date Дата.
 * @returns Строка вида `2026-05-25T16:03:00`.
 */
export const toNaiveDateTime = (date: Date): string => {
  const pad = (value: number): string => String(value).padStart(2, '0');

  return (
    `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  );
};

/**
 * Разбирает naive-строку ответа обратно в дату.
 *
 * Своя реализация, а не `parseApiDateTime` из `shared`: моки не имеют права
 * зависеть от прод-кода — иначе тестовый дубль и проверяемый код начинают
 * подтверждать друг друга.
 * @param value Строка вида `2026-05-25T16:03:00`.
 * @returns Дата или `null`, если строка не разбирается.
 */
export const fromNaiveDateTime = (value: string): Date | null => {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/u.exec(value);

  if (match === null) return null;

  const [, year, month, day, hours, minutes, seconds] = match;

  return new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes),
    Number(seconds ?? '0'),
  );
};

/**
 * Сдвигает naive-время на заданное число минут, сохраняя формат.
 * @param value Исходная строка времени.
 * @param minutes Сколько минут добавить.
 * @returns Новая строка времени либо исходная, если она не разобралась.
 */
export const addMinutesToNaive = (value: string, minutes: number): string => {
  const parsed = fromNaiveDateTime(value);

  if (parsed === null) return value;

  parsed.setMinutes(parsed.getMinutes() + minutes);

  return toNaiveDateTime(parsed);
};
