import { describe, expect, it } from 'vitest';

import { DEFAULT_PER_PAGE, MAX_PER_PAGE } from '../model/auction-search.schema';

import { parseAuctionSearch } from './parse-auction-search.util';

describe('parseAuctionSearch: безопасные fallback (0.3)', () => {
  it('пустой объект даёт дефолты, а не пустоту', () => {
    const search = parseAuctionSearch({});

    expect(search.page).toBe(1);
    expect(search.perPage).toBe(DEFAULT_PER_PAGE);
    expect(search.status).toEqual([]);
    expect(search.aucType).toEqual([]);
    expect(search.cargoNum).toBeUndefined();
  });

  it('мусор вместо чисел не роняет разбор', () => {
    // Ровно тот URL из критерия готовности фазы: ?page=abc&per_page=99999.
    const search = parseAuctionSearch({ page: 'abc', per_page: '99999' });

    expect(search.page).toBe(1);
    expect(search.perPage).toBe(MAX_PER_PAGE);
  });

  it('page клампится снизу: нулевой и отрицательной страницы не бывает', () => {
    expect(parseAuctionSearch({ page: 0 }).page).toBe(1);
    expect(parseAuctionSearch({ page: -5 }).page).toBe(1);
    expect(parseAuctionSearch({ page: 2.7 }).page).toBe(2);
  });

  it('per_page клампится в оба конца — 422 от сервера быть не должно', () => {
    expect(parseAuctionSearch({ per_page: 0 }).perPage).toBe(1);
    expect(parseAuctionSearch({ per_page: 5000 }).perPage).toBe(MAX_PER_PAGE);
    expect(parseAuctionSearch({ per_page: 50 }).perPage).toBe(50);
  });

  it('неизвестные значения enum отбрасываются, а известные остаются', () => {
    // Схема допускает Unknown во всех enum'ах (④), но фильтровать по нему нельзя:
    // в enum'е фильтра `auc_type` его просто нет.
    const search = parseAuctionSearch({
      status: ['Leading', 'МУСОР', 'OnPending'],
      auc_type: ['Down', 'Unknown', 'НетТакого'],
    });

    expect(search.status).toEqual(['Leading', 'OnPending']);
    expect(search.aucType).toEqual(['Down']);
  });

  it('понимает и camelCase-ключи: роутер возвращает состояние в них', () => {
    // Из URL приходит snake_case, но после собственной записи роутер отдаёт
    // уже разобранное состояние — и разбор должен пережить оба написания.
    const search = parseAuctionSearch({ cargoNum: 'A-1', loadCity: 'Москва', perPage: 50 });

    expect(search.cargoNum).toBe('A-1');
    expect(search.loadCity).toBe('Москва');
    expect(search.perPage).toBe(50);
  });

  it('при конфликте написаний побеждает snake_case — форма из адресной строки', () => {
    const search = parseAuctionSearch({ cargo_num: 'A-1', cargoNum: 'A-2' });

    expect(search.cargoNum).toBe('A-1');
  });

  it('незнакомые параметры URL игнорируются, а не ломают разбор', () => {
    // В ссылку могли дописать utm-метки или параметры другой версии приложения.
    const search = parseAuctionSearch({ utm_source: 'mail', foo: 'bar', page: 2 });

    expect(search.page).toBe(2);
    expect(Object.keys(search)).not.toContain('foo');
  });

  it('числа принимаются и строкой — из URL они всегда приходят строками', () => {
    expect(parseAuctionSearch({ page: '5' }).page).toBe(5);
    expect(parseAuctionSearch({ per_page: '50' }).perPage).toBe(50);
  });

  it('одиночное значение принимается как массив из одного элемента', () => {
    // URL вида ?auc_type=Down встречается чаще, чем ?auc_type[]=Down.
    expect(parseAuctionSearch({ auc_type: 'Down' }).aucType).toEqual(['Down']);
    expect(parseAuctionSearch({ statuses: 'Auction' }).statuses).toEqual(['Auction']);
  });

  it('весь массив из мусора вырождается в пустой фильтр, а не в ошибку', () => {
    expect(parseAuctionSearch({ status: ['НЕТ', 'ТОЖЕ НЕТ'] }).status).toEqual([]);
  });

  it('из смешанного массива остаются допустимые значения, а не весь массив целиком', () => {
    const search = parseAuctionSearch({ statuses: ['Auction', 'МУСОР', 'Canceled'] });

    expect(search.statuses).toEqual(['Auction', 'Canceled']);
  });

  it('даты принимаются только в формате контракта (⑮)', () => {
    const valid = parseAuctionSearch({ load_date_from: '2026-05-26T15:30:00+03:00' });

    expect(valid.loadDateFrom).toBe('2026-05-26T15:30:00+03:00');
    // Naive-время в фильтр не годится: схема требует смещение.
    expect(
      parseAuctionSearch({ load_date_from: '2026-05-26T15:30:00' }).loadDateFrom,
    ).toBeUndefined();
    expect(parseAuctionSearch({ load_date_from: '26.05.2026' }).loadDateFrom).toBeUndefined();
  });

  it('разбирает обе границы диапазона дат', () => {
    const search = parseAuctionSearch({
      load_date_from: '2026-05-01T10:00:00+03:00',
      load_date_to: '2026-05-10T18:00:00+03:00',
    });

    expect(search.loadDateFrom).toBe('2026-05-01T10:00:00+03:00');
    expect(search.loadDateTo).toBe('2026-05-10T18:00:00+03:00');
  });

  it('булевы фильтры понимают строковую форму из URL', () => {
    expect(parseAuctionSearch({ is_available: 'true' }).isAvailable).toBe(true);
    expect(parseAuctionSearch({ is_available: true }).isAvailable).toBe(true);
    expect(parseAuctionSearch({ is_available: 'МУСОР' }).isAvailable).toBeUndefined();
    expect(parseAuctionSearch({ is_bidder: 'false' }).isBidder).toBe(false);
  });

  it('диапазон цен разбирается, мусор отбрасывается', () => {
    const search = parseAuctionSearch({ price_from: '30000', price_to: 'дорого' });

    expect(search.priceFrom).toBe(30_000);
    expect(search.priceTo).toBeUndefined();
  });

  it('отрицательная цена отбрасывается: торгов с отрицательной ценой не бывает', () => {
    expect(parseAuctionSearch({ price_from: -100 }).priceFrom).toBeUndefined();
  });

  it('пустые строки не превращаются в фильтр по пустой строке', () => {
    const search = parseAuctionSearch({ cargo_num: '', load_city: '   ' });

    expect(search.cargoNum).toBeUndefined();
    expect(search.loadCity).toBeUndefined();
  });

  it('пробелы вокруг значения обрезаются', () => {
    // Решение в пользу пользователя: «  A-100  », вставленное из письма,
    // обязано найти тот же аукцион, что и «A-100».
    expect(parseAuctionSearch({ cargo_num: '  A-100  ' }).cargoNum).toBe('A-100');
    expect(parseAuctionSearch({ load_city: ' Москва ' }).loadCity).toBe('Москва');
  });

  it('null и не-объект на входе дают дефолты', () => {
    expect(parseAuctionSearch(null).page).toBe(1);
    expect(parseAuctionSearch('строка').page).toBe(1);
    expect(parseAuctionSearch(undefined).perPage).toBe(DEFAULT_PER_PAGE);
  });
});
