import { notFound } from '@tanstack/react-router';

import { isApiError } from '../../api/api-error';

/**
 * Превращает 404 контракта в `notFound()` роутера.
 *
 * 404 объявлен у трёх операций из четырёх и означает **ожидаемое состояние**, а
 * не сбой (⑪): аукцион сняли с торгов, ссылка устарела, доступа нет. Без этого
 * преобразования ошибка уходит в `errorComponent` наравне с 503 и сетевым
 * сбоем, а `notFoundComponent` маршрута не срабатывает никогда — то есть
 * пользователь получает экран ошибки без дороги назад вместо «не найдено» с
 * ссылкой на список.
 *
 * Всё остальное пробрасывается как есть: 401 и 503 — это именно ошибки, и
 * показывать их как «не найдено» значило бы врать.
 * @param load Загрузка данных маршрута — обычно `ensureQueryData`.
 * @returns Данные маршрута.
 * @throws {Error} Результат `notFound()` при 404 либо исходную ошибку.
 */
export const loadOrNotFound = async <T>(load: () => Promise<T>): Promise<T> => {
  try {
    return await load();
  } catch (error) {
    if (isApiError(error) && error.status === 404) throw notFound();

    throw error;
  }
};
