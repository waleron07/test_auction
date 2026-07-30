import { describe, expect, it } from 'vitest';

import { isMultipleOf } from './is-multiple-of.util';

describe('isMultipleOf', () => {
  it('кратное значение принимает', () => {
    expect(isMultipleOf(30500, 500)).toBe(true);
  });

  it('некратное отклоняет', () => {
    expect(isMultipleOf(30300, 500)).toBe(false);
  });

  it('значение меньше шага кратным не считается', () => {
    expect(isMultipleOf(100, 500)).toBe(false);
  });

  it('ноль кратен любому шагу', () => {
    expect(isMultipleOf(0, 500)).toBe(true);
  });

  it('переживает float: 0.1 + 0.2 не должно ломать проверку шага', () => {
    // 30000.3 % 0.1 в двоичной арифметике даёт не ноль — без допуска
    // валидация формы отклоняла бы корректную ставку.
    expect(isMultipleOf(30000.3, 0.1)).toBe(true);
    expect(isMultipleOf(0.3, 0.1)).toBe(true);
  });

  it('допуск работает и на значении, собранном самой арифметикой float', () => {
    // 0.1 + 0.2 === 0.30000000000000004 — ровно то значение, которое придёт
    // из подсказки «+ шаг» в форме ставки.
    expect(isMultipleOf(0.1 + 0.2, 0.1)).toBe(true);
  });

  it('поддерживает шаг в копейках', () => {
    expect(isMultipleOf(100.05, 0.01)).toBe(true);
    expect(isMultipleOf(100.055, 0.01)).toBe(false);
  });

  it('знак значения на кратность не влияет', () => {
    expect(isMultipleOf(-1000, 500)).toBe(true);
    expect(isMultipleOf(-1300, 500)).toBe(false);
  });

  it('работает на больших суммах', () => {
    expect(isMultipleOf(1_000_000_000_000, 500)).toBe(true);
    expect(isMultipleOf(1_000_000_000_300, 500)).toBe(false);
  });

  it('шаг не задан — ограничения нет', () => {
    expect(isMultipleOf(12345, null)).toBe(true);
    expect(isMultipleOf(12345, 0)).toBe(true);
    expect(isMultipleOf(12345, undefined)).toBe(true);
  });

  it('отрицательный шаг тоже трактуется как отсутствие ограничения', () => {
    // Решение в пользу пользователя: отрицательный шаг — испорченные данные,
    // но отклонять из-за них любую цену значит запретить единственное
    // бизнес-действие приложения. Аномалия нормализуется в маппере
    // (step <= 0 → «шага нет»), а не здесь.
    expect(isMultipleOf(12345, -500)).toBe(true);
  });
});
