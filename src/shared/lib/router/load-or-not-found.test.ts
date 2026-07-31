import { isNotFound } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

import { ApiError, NetworkError } from '../../api/api-error';

import { loadOrNotFound } from './load-or-not-found.util';

const apiError = (status: number): ApiError =>
  new ApiError(status, {
    code: 'some_code',
    title: 'Заголовок',
    message: 'Сообщение.',
  });

describe('loadOrNotFound (⑪⑯)', () => {
  it('успешная загрузка отдаёт данные без изменений', async () => {
    const data = { orderUid: 'A-1' };

    await expect(loadOrNotFound(() => Promise.resolve(data))).resolves.toBe(data);
  });

  it('404 превращается в notFound() роутера, а не в ошибку', async () => {
    const error: unknown = await loadOrNotFound(() => Promise.reject(apiError(404))).catch(
      (caught: unknown) => caught,
    );

    // Именно `notFound()`, а не «какая-то ошибка»: только он включает
    // `notFoundComponent` маршрута с дорогой назад к списку.
    expect(isNotFound(error)).toBe(true);
  });

  it('401 пробрасывается как есть — это ошибка, а не «не найдено»', async () => {
    const error = apiError(401);

    await expect(loadOrNotFound(() => Promise.reject(error))).rejects.toBe(error);
  });

  it('503 пробрасывается как есть', async () => {
    const error = apiError(503);

    await expect(loadOrNotFound(() => Promise.reject(error))).rejects.toBe(error);
  });

  it('сетевой сбой не подменяется на «не найдено»', async () => {
    const error = new NetworkError('Нет связи.');

    await expect(loadOrNotFound(() => Promise.reject(error))).rejects.toBe(error);
  });

  it('ошибка не из контракта пробрасывается как есть', async () => {
    const error = new Error('Что-то сломалось в рендере.');

    await expect(loadOrNotFound(() => Promise.reject(error))).rejects.toBe(error);
  });

  it('загрузчик вызывается ровно один раз — повторов на ошибке нет', async () => {
    const load = vi.fn(() => Promise.reject(apiError(404)));

    await loadOrNotFound(load).catch(() => undefined);

    expect(load).toHaveBeenCalledTimes(1);
  });
});
