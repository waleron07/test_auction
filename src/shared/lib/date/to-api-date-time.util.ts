import { format, isValid } from 'date-fns';

/**
 * Сериализует дату для фильтров запроса: ISO 8601 **со смещением**.
 *
 * Фильтры `AuctionListRequest` валидируются строгим `pattern`
 * (`^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)$`), тогда
 * как в ответах то же время приходит без смещения — асимметрия ⑮. Поэтому
 * сериализация и разбор — две разные функции, а не одна на `toISOString`:
 * `toISOString` даёт UTC, и выбранный пользователем «26 мая» уехал бы на день.
 * @param date Дата из пикера (локальное время пользователя).
 * @returns Строка под `pattern` схемы или `null`, если дата невалидна.
 */
export const toApiDateTime = (date: Date): string | null =>
  isValid(date) ? format(date, "yyyy-MM-dd'T'HH:mm:ssXXX") : null;
