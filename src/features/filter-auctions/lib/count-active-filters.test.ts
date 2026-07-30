import { describe, expect, it } from 'vitest';

import { countActiveFilters } from './count-active-filters.util';
import { parseAuctionSearch } from './parse-auction-search.util';

describe('countActiveFilters: бейдж активных фильтров на мобильной кнопке', () => {
  it('пустые фильтры дают ноль', () => {
    expect(countActiveFilters(parseAuctionSearch({}))).toBe(0);
  });

  it('пагинация фильтром не считается', () => {
    // Иначе бейдж «Фильтры: 2» горел бы на чистой второй странице.
    expect(countActiveFilters(parseAuctionSearch({ page: 3, per_page: 50 }))).toBe(0);
  });

  it('сортировка фильтром не считается', () => {
    expect(countActiveFilters(parseAuctionSearch({ sort: 'oldest' }))).toBe(0);
  });

  it('каждый заполненный фильтр считается один раз, независимо от числа значений', () => {
    const search = parseAuctionSearch({ status: ['Leading', 'Losing'], cargo_num: 'A-1' });

    expect(countActiveFilters(search)).toBe(2);
  });

  it('is_available учитывается только при true', () => {
    expect(countActiveFilters(parseAuctionSearch({ is_available: false }))).toBe(0);
    expect(countActiveFilters(parseAuctionSearch({ is_available: true }))).toBe(1);
  });

  it('is_bidder учитывается только при true', () => {
    // Функция симметрична по обоим переключателям, и проверяются оба.
    expect(countActiveFilters(parseAuctionSearch({ is_bidder: false }))).toBe(0);
    expect(countActiveFilters(parseAuctionSearch({ is_bidder: true }))).toBe(1);
  });

  it('диапазон цены считается одним фильтром с любой стороны', () => {
    // Реализация написана как `from || to`: проверяются обе половины,
    // иначе одна из веток остаётся непокрытой.
    expect(countActiveFilters(parseAuctionSearch({ price_from: 100 }))).toBe(1);
    expect(countActiveFilters(parseAuctionSearch({ price_to: 200 }))).toBe(1);
    expect(countActiveFilters(parseAuctionSearch({ price_from: 100, price_to: 200 }))).toBe(1);
  });

  it('диапазон дат считается одним фильтром с любой стороны', () => {
    expect(
      countActiveFilters(parseAuctionSearch({ load_date_from: '2026-05-01T10:00:00+03:00' })),
    ).toBe(1);
    expect(
      countActiveFilters(parseAuctionSearch({ load_date_to: '2026-05-10T10:00:00+03:00' })),
    ).toBe(1);
    expect(
      countActiveFilters(
        parseAuctionSearch({
          load_date_from: '2026-05-01T10:00:00+03:00',
          load_date_to: '2026-05-10T10:00:00+03:00',
        }),
      ),
    ).toBe(1);
  });

  it('два разных диапазона — это два фильтра', () => {
    const search = parseAuctionSearch({
      price_from: 100,
      load_date_from: '2026-05-01T10:00:00+03:00',
    });

    expect(countActiveFilters(search)).toBe(2);
  });

  it('все обязательные фильтры задания учитываются', () => {
    const search = parseAuctionSearch({
      cargo_num: 'A-1',
      status: ['Leading'],
      statuses: ['Auction'],
      auc_type: ['Down'],
      load_city: 'Москва',
      unload_city: 'Казань',
      load_date_from: '2026-05-01T10:00:00+03:00',
      load_date_to: '2026-05-10T10:00:00+03:00',
      is_available: true,
      is_bidder: true,
      price_from: 100,
      price_to: 200,
    });

    // 12 параметров URL складываются в 10 логических фильтров: диапазоны дат
    // и цены — по одному фильтру на пару границ.
    expect(countActiveFilters(search)).toBe(10);
  });
});
