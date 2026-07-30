import { describe, expect, it } from 'vitest';

import { toApiDateTime } from './to-api-date-time.util';

/**
 * `pattern` фильтров дат из схемы (`AuctionListRequest.load_date_from`).
 * Скопирован дословно: тест проверяет соответствие контракту, а не догадке
 * о том, как выглядит ISO 8601 (ловушка ⑮).
 */
const SCHEMA_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(([+-]\d{2}:\d{2})|Z)$/;

/**
 * Ожидаемый хвост смещения для зоны, в которой идёт прогон. Считается из
 * `getTimezoneOffset`, а не хардкодится: тест обязан быть зелёным и в Москве,
 * и в UTC, где корректный хвост — именно `Z`.
 */
const expectedOffsetSuffix = (date: Date): string => {
  const offsetMinutes = -date.getTimezoneOffset();

  if (offsetMinutes === 0) return 'Z';

  const sign = offsetMinutes > 0 ? '+' : '-';
  const absolute = Math.abs(offsetMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');

  return `${sign}${hours}:${minutes}`;
};

describe('toApiDateTime (⑮)', () => {
  it('даёт строку, проходящую pattern схемы', () => {
    expect(toApiDateTime(new Date(2026, 4, 26, 15, 30, 0))).toMatch(SCHEMA_PATTERN);
  });

  it('сохраняет локальные компоненты времени, а не переводит в UTC', () => {
    // Тест не зависит от таймзоны прогона: дата собрана из локальных компонентов,
    // и сериализация обязана вернуть их же плюс смещение этой зоны.
    expect(toApiDateTime(new Date(2026, 4, 26, 15, 30, 0))).toMatch(
      /^2026-05-26T15:30:00([+-]\d{2}:\d{2}|Z)$/,
    );
  });

  it('ставит смещение локальной зоны, а не хвост «Z» от toISOString', () => {
    // Самый частый способ сломать этот фильтр — `date.toISOString()`: он всегда
    // отдаёт UTC и хвост `Z`, из-за чего выбранный пользователем день уезжает.
    const date = new Date(2026, 4, 26, 15, 30, 0);

    expect(toApiDateTime(date)?.endsWith(expectedOffsetSuffix(date))).toBe(true);
  });

  it('не теряет момент времени: разбор результата даёт исходную дату', () => {
    const date = new Date(2026, 0, 1, 0, 0, 0);
    const serialized = toApiDateTime(date);

    expect(serialized).not.toBeNull();
    expect(new Date(serialized ?? '').getTime()).toBe(date.getTime());
  });

  it('отбрасывает миллисекунды, оставляя секунды на месте', () => {
    // Проверяется результат целиком, а не отсутствие подстроки «.777»:
    // «не содержит .777» было бы истинно и для сломанного формата.
    expect(toApiDateTime(new Date(2026, 4, 26, 15, 30, 0, 777))).toMatch(
      /^2026-05-26T15:30:00([+-]\d{2}:\d{2}|Z)$/,
    );
  });

  it('на невалидной дате возвращает null, а не строку "Invalid Date"', () => {
    expect(toApiDateTime(new Date('нет такой даты'))).toBeNull();
  });
});
