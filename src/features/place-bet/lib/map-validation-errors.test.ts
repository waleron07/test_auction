import { describe, expect, it } from 'vitest';

import { ValidationApiError } from '@/shared/api/api-error';

import { mapValidationErrors } from './map-validation-errors.util';

const error = (errors: { field: string; message: string }[]): ValidationApiError =>
  new ValidationApiError(422, {
    code: 'validation_failed',
    title: 'Ошибка валидации',
    message: 'Проверьте введённые данные.',
    errors,
  });

describe('mapValidationErrors (⑯)', () => {
  it('ошибка по price уходит в fieldErrors.price, generalMessage пуст', () => {
    const result = mapValidationErrors(
      error([{ field: 'price', message: 'Цена должна быть больше нуля.' }]),
    );

    expect(result.fieldErrors.price).toBe('Цена должна быть больше нуля.');
    expect(result.generalMessage).toBeNull();
  });

  it('ошибка по незнакомому полю уходит в общий алерт, а не теряется', () => {
    const result = mapValidationErrors(
      error([{ field: 'unknown_field', message: 'Что-то не так.' }]),
    );

    expect(result.fieldErrors.price).toBeUndefined();
    expect(result.generalMessage).toBe('Что-то не так.');
  });

  it('смешанный список: price в форму, остальное в общий алерт', () => {
    const result = mapValidationErrors(
      error([
        { field: 'price', message: 'Цена должна быть больше нуля.' },
        { field: 'auction_id', message: 'Аукцион не найден.' },
      ]),
    );

    expect(result.fieldErrors.price).toBe('Цена должна быть больше нуля.');
    expect(result.generalMessage).toBe('Аукцион не найден.');
  });

  it('несколько сообщений по незнакомым полям объединяются в один алерт', () => {
    const result = mapValidationErrors(
      error([
        { field: 'foo', message: 'Ошибка foo.' },
        { field: 'bar', message: 'Ошибка bar.' },
      ]),
    );

    expect(result.generalMessage).toBe('Ошибка foo. Ошибка bar.');
  });

  it('пустой список ошибок — пустой результат', () => {
    const result = mapValidationErrors(error([]));

    expect(result.fieldErrors).toEqual({});
    expect(result.generalMessage).toBeNull();
  });
});
