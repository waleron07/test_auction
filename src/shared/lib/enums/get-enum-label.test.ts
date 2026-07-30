import { describe, expect, it } from 'vitest';

import { AUCTION_STATUS_CODE, AUCTION_STATUS_DICT } from './auction-status.dict';
import { type EnumDict } from './enum-dict.types';
import { getEnumEntry, getEnumLabel } from './get-enum-label.util';
import { TRADING_STATUS_DICT } from './trading-status.dict';

describe('getEnumLabel (③④)', () => {
  it('известное значение отдаёт своим лейблом', () => {
    expect(getEnumLabel(TRADING_STATUS_DICT, 'Leading')).toBe('Лидирую');
  });

  it('известное значение возвращает ту же запись словаря, а не её копию', () => {
    // toBe, а не toEqual: проверяется, что запись взята из словаря,
    // а не собрана заново где-то в утилите.
    expect(getEnumEntry(TRADING_STATUS_DICT, 'Winner')).toBe(TRADING_STATUS_DICT.Winner);
  });

  it('незнакомое значение падает в Unknown, а не наружу', () => {
    // Инлайновый enum status_mobile содержит 6 значений, общий TradingStatus — 9.
    // Значение, которого нет в словаре, обязано деградировать до «Неизвестно».
    expect(getEnumLabel(TRADING_STATUS_DICT, 'СовсемНовыйСтатус')).toBe('Неизвестно');
    expect(getEnumLabel(TRADING_STATUS_DICT, null)).toBe('Неизвестно');
    expect(getEnumLabel(TRADING_STATUS_DICT, undefined)).toBe('Неизвестно');
  });

  it('для незнакомого значения берётся именно запись Unknown из словаря', () => {
    // Тоже toBe: общий FALLBACK структурно равен записи Unknown этого словаря,
    // и toEqual не отличил бы `return dict.Unknown` от `return FALLBACK`.
    // Разница существенная: словарь вправе дать своё «Неизвестно» — с другим
    // лейблом или цветом, — и утилита обязана предпочитать его.
    expect(getEnumEntry(TRADING_STATUS_DICT, 'NoSuchStatus')).toBe(TRADING_STATUS_DICT.Unknown);
  });

  it('пустая строка тоже деградирует в Unknown', () => {
    // DTO этой схемы охотно присылает '' вместо null (⑫), в том числе в enum-полях.
    expect(getEnumLabel(TRADING_STATUS_DICT, '')).toBe('Неизвестно');
    expect(getEnumEntry(TRADING_STATUS_DICT, '')).toBe(TRADING_STATUS_DICT.Unknown);
  });

  it('словарь без Unknown обслуживается общим фолбэком, а не падает', () => {
    // Единственный путь к FALLBACK в утилите. Все нынешние словари содержат
    // Unknown, потому что он есть во всех enum'ах схемы, но утилита обязана
    // пережить словарь, собранный по инлайновому enum'у без него.
    const dictWithoutUnknown: EnumDict<'Active'> = {
      Active: { label: 'Активен', color: 'success' },
    };

    expect(getEnumEntry(dictWithoutUnknown, 'SomethingElse')).toEqual({
      label: 'Неизвестно',
      color: 'default',
    });
    expect(getEnumLabel(dictWithoutUnknown, null)).toBe('Неизвестно');
  });

  it('словарь TradingStatus покрывает значения, которых нет в инлайновом enum (③)', () => {
    // Проверяется не число ключей, а наличие именно тех трёх значений, которых
    // status_mobile не знает: полнота словаря по enum'у гарантирована типом
    // EnumDict<NonNullable<TradingStatusDto>> — новое значение в схеме уронит
    // typecheck, и дублировать это хрупкой проверкой длины не нужно.
    expect(TRADING_STATUS_DICT).toMatchObject({
      OnPending: expect.any(Object),
      ChoosingWinner: expect.any(Object),
      Accepted: expect.any(Object),
    });
  });
});

describe('AUCTION_STATUS_CODE (②)', () => {
  it('кодирует крайние статусы так, как ждёт фильтр statuses', () => {
    expect(AUCTION_STATUS_CODE.Planning).toBe(1);
    expect(AUCTION_STATUS_CODE.Canceled).toBe(8);
  });

  it('коды идут подряд без пропусков', () => {
    // Бизнес-правило: фильтр `statuses` принимает числа, соответствие
    // «строка ↔ число» в схеме не описано. Пропуск в середине означал бы,
    // что один из статусов молча не фильтруется.
    expect(Object.values(AUCTION_STATUS_CODE)).toEqual(
      Array.from({ length: 8 }, (_, index) => index + 1),
    );
  });

  it('Unknown кода не имеет: фильтровать по «неизвестно» нельзя', () => {
    expect(AUCTION_STATUS_CODE).not.toHaveProperty('Unknown');
    // При этом словарь лейблов его знает — отображать нужно.
    expect(AUCTION_STATUS_DICT).toHaveProperty('Unknown');
  });
});
