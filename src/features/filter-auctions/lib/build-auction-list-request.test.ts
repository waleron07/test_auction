import { describe, expect, it } from 'vitest';

import { AUCTION_STATUS_CODE } from '@/shared/lib/enums/auction-status.dict';

import { buildAuctionListRequest } from './build-auction-list-request.util';
import { parseAuctionSearch } from './parse-auction-search.util';

/** Разбор пустого URL: дефолтное состояние страницы списка. */
const defaultSearch = parseAuctionSearch({});

describe('buildAuctionListRequest (①②⑮)', () => {
  it('из пустых фильтров собирает только пагинацию', () => {
    // Ключ запроса содержит тело целиком: лишние поля означали бы другой ключ
    // и промах мимо прогретого prefetch'ем кэша.
    expect(buildAuctionListRequest(defaultSearch)).toEqual({ page: 1, per_page: 20 });
  });

  it('в тело попадают только заданные поля — ключей-пустышек нет', () => {
    const request = buildAuctionListRequest(parseAuctionSearch({ cargo_num: 'A-240001' }));

    // Проверяется набор ключей, а не значения: ключ со значением undefined
    // меняет ключ запроса TanStack Query так же, как ключ со значением.
    expect(Object.keys(request).sort()).toEqual(['cargo_num', 'page', 'per_page']);
    expect(request).toEqual({ page: 1, per_page: 20, cargo_num: 'A-240001' });
  });

  it('форма тела стабильна: одно состояние — один объект', () => {
    // Разный порядок ключей в URL не должен давать разные query keys.
    const first = buildAuctionListRequest(
      parseAuctionSearch({ page: 2, cargo_num: 'A-1', is_bidder: true }),
    );
    const second = buildAuctionListRequest(
      parseAuctionSearch({ is_bidder: true, cargo_num: 'A-1', page: 2 }),
    );

    expect(JSON.stringify(first)).toBe(JSON.stringify(second));
  });

  it('торговый статус уходит строками в status, статус аукциона — кодами в statuses (①②)', () => {
    const request = buildAuctionListRequest(
      parseAuctionSearch({ status: ['Leading'], statuses: ['Auction', 'Canceled'] }),
    );

    expect(request.status).toEqual(['Leading']);
    expect(request.statuses).toEqual([2, 8]);
    // mobile_statuses — дубль status, слать оба значит конфликтовать с собой.
    expect(request.mobile_statuses).toBeUndefined();
  });

  it('все восемь статусов аукциона превращаются в коды 1–8 (②)', () => {
    // Проверяется весь набор, а не пара значений: соответствие «строка ↔ число»
    // в схеме не описано, это соглашение проекта, и пропуск в середине означал
    // бы, что один из статусов молча не фильтруется.
    const statuses = [
      'Planning',
      'Auction',
      'DeterminateWinner',
      'WaitDeal',
      'InProgress',
      'Finished',
      'Stopped',
      'Canceled',
    ] as const satisfies readonly (keyof typeof AUCTION_STATUS_CODE)[];
    const request = buildAuctionListRequest(parseAuctionSearch({ statuses }));

    expect(request.statuses).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(request.statuses).toEqual(statuses.map((name) => AUCTION_STATUS_CODE[name]));
  });

  it('типы аукциона уходят строками, без преобразования', () => {
    const request = buildAuctionListRequest(parseAuctionSearch({ auc_type: ['Down', 'Up'] }));

    expect(request.auc_type).toEqual(['Down', 'Up']);
  });

  it('города превращаются в пару «название + gc_id» из словаря (⑲)', () => {
    const request = buildAuctionListRequest(
      parseAuctionSearch({ load_city: 'Москва', unload_city: 'Казань' }),
    );

    expect(request.load_city).toBe('Москва');
    expect(request.load_gc_id).toBe(1);
    expect(request.unload_city).toBe('Казань');
    expect(request.unload_gc_id).toBe(5);
  });

  it('поиск города в словаре нечувствителен к регистру', () => {
    // Город приходит из URL, где его мог набрать человек.
    const request = buildAuctionListRequest(parseAuctionSearch({ load_city: 'мОСкВА' }));

    expect(request.load_city).toBe('мОСкВА');
    expect(request.load_gc_id).toBe(1);
  });

  it('город не из словаря уходит строкой без gc_id, а не отбрасывается', () => {
    const request = buildAuctionListRequest(
      parseAuctionSearch({ load_city: 'Урюпинск', unload_city: 'Неизвестный' }),
    );

    expect(request.load_city).toBe('Урюпинск');
    expect(request.load_gc_id).toBeUndefined();
    expect(request.unload_city).toBe('Неизвестный');
    expect(request.unload_gc_id).toBeUndefined();
  });

  it('даты уходят как есть — они уже проверены pattern-ом схемы (⑮)', () => {
    const request = buildAuctionListRequest(
      parseAuctionSearch({
        load_date_from: '2026-05-26T15:30:00+03:00',
        load_date_to: '2026-05-27T15:30:00+03:00',
      }),
    );

    expect(request.load_date_from).toBe('2026-05-26T15:30:00+03:00');
    expect(request.load_date_to).toBe('2026-05-27T15:30:00+03:00');
  });

  it('цены уходят в current_price_from/to, а не в price_from', () => {
    const request = buildAuctionListRequest(
      parseAuctionSearch({ price_from: 30_000, price_to: 60_000 }),
    );

    expect(request.current_price_from).toBe(30_000);
    expect(request.current_price_to).toBe(60_000);
  });

  it('булевы фильтры уходят только когда включены', () => {
    const enabled = buildAuctionListRequest(
      parseAuctionSearch({ is_available: true, is_bidder: true }),
    );

    expect(enabled.is_available).toBe(true);
    expect(enabled.is_bidder).toBe(true);
  });

  it('оба булевых фильтра со значением false в тело не попадают', () => {
    // false — это «не фильтровать», а не «показать обратное»: обратного
    // значения у этих фильтров в контракте нет.
    const request = buildAuctionListRequest(
      parseAuctionSearch({ is_available: false, is_bidder: false }),
    );

    expect(request.is_available).toBeUndefined();
    expect(request.is_bidder).toBeUndefined();
    expect(Object.keys(request).sort()).toEqual(['page', 'per_page']);
  });

  it('сортировка «сначала старые» уходит признаком is_oldest', () => {
    expect(buildAuctionListRequest(parseAuctionSearch({ sort: 'oldest' })).is_oldest).toBe(true);
    expect(buildAuctionListRequest(parseAuctionSearch({})).is_oldest).toBeUndefined();
  });

  it('пустые массивы фильтров в тело не попадают', () => {
    const request = buildAuctionListRequest(parseAuctionSearch({ status: ['МУСОР'] }));

    expect(request.status).toBeUndefined();
    expect(request).toEqual({ page: 1, per_page: 20 });
  });
});
