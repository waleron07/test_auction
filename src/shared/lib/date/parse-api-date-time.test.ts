import { describe, expect, it } from 'vitest';

import { parseApiDateTime } from './parse-api-date-time.util';
import { toApiDateTime } from './to-api-date-time.util';

describe('parseApiDateTime (⑮)', () => {
  it('разбирает naive-время ответа как локальное, без сдвига на смещение зоны', () => {
    const parsed = parseApiDateTime('2026-05-25T16:03:00');

    // Именно здесь живёт тихий баг в ±N часов: `new Date('2026-05-25T16:03:00')`
    // в спецификации трактуется как локальное время, но для строк с датой без
    // времени — как UTC, и полагаться на это поведение нельзя.
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(4);
    expect(parsed?.getDate()).toBe(25);
    expect(parsed?.getHours()).toBe(16);
    expect(parsed?.getMinutes()).toBe(3);
  });

  it('учитывает смещение, если оно всё-таки пришло, а не отбрасывает его', () => {
    expect(parseApiDateTime('2026-05-25T16:03:00+03:00')?.getTime()).toBe(
      Date.parse('2026-05-25T16:03:00+03:00'),
    );
    expect(parseApiDateTime('2026-05-25T16:03:00Z')?.getTime()).toBe(
      Date.parse('2026-05-25T16:03:00Z'),
    );
  });

  it('принимает форму без секунд — регулярка её допускает', () => {
    expect(parseApiDateTime('2026-05-25T16:03')?.getHours()).toBe(16);
    expect(parseApiDateTime('2026-05-25T16:03')?.getMinutes()).toBe(3);
  });

  it('принимает миллисекунды: их допускает и pattern схемы', () => {
    expect(parseApiDateTime('2026-05-25T16:03:00.123')?.getMilliseconds()).toBe(123);
  });

  it('отвергает дату без времени: это не полночь, а неожиданный формат', () => {
    // Ровно этот кейс и объясняет существование регулярок: `parseISO`
    // разобрал бы «2026-05-25» в локальную полночь, и время суток в UI
    // оказалось бы выдуманным.
    expect(parseApiDateTime('2026-05-25')).toBeNull();
  });

  it('отвергает невозможную календарную дату', () => {
    expect(parseApiDateTime('2026-02-31T10:00:00')).toBeNull();
  });

  it('пустую строку, пробелы, null и undefined трактует как «не задано»', () => {
    expect(parseApiDateTime('')).toBeNull();
    expect(parseApiDateTime('   ')).toBeNull();
    expect(parseApiDateTime(null)).toBeNull();
    expect(parseApiDateTime(undefined)).toBeNull();
  });

  it('на мусоре возвращает null, а не Invalid Date', () => {
    expect(parseApiDateTime('25.05.2026 16:03')).toBeNull();
  });

  it('round-trip с toApiDateTime не теряет момент времени', () => {
    // Именно этой парой пользуется код: дата из пикера уходит в фильтр,
    // возвращается в ответе и снова разбирается.
    const original = new Date(2026, 4, 26, 15, 30, 0);
    const serialized = toApiDateTime(original);

    expect(serialized).not.toBeNull();
    expect(parseApiDateTime(serialized)?.getTime()).toBe(original.getTime());
  });
});
