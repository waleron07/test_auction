import { describe, expect, it } from 'vitest';

import { type AuctionListItemDto } from '@/shared/api/dto';
import { DASH, NBSP } from '@/shared/lib/string/typography.const';

import { mapAuctionCard } from './map-auction-card.util';

/** Минимально осмысленный элемент списка: остальное дописывают тесты. */
const listItem = (overrides: Partial<AuctionListItemDto> = {}): AuctionListItemDto => ({
  main: {
    id: 1,
    cargo_num: 'A-240001',
    order_uid: 'auction-1001',
    auc_type: 'Down',
    cargo_date: '2026-05-26T10:00:00',
    created_at: '2026-05-25T09:00:00',
    priority_sort: 1,
    is_assembly: false,
    price_per_km: 74.5,
  },
  organizer: { organization_name: 'АО «Грузовладелец»', is_hide_organization: false },
  route: {
    load: {
      city: 'Москва',
      address: 'ул. Складская, 10',
      date: '2026-05-26T10:00:00',
      city_gc_id: 1,
      points_count: 1,
    },
    unload: {
      city: 'Казань',
      address: 'пр. Промышленный, 4',
      date: '2026-05-27T18:00:00',
      city_gc_id: 5,
      points_count: 1,
    },
  },
  cargo: { name: 'Бумага офисная', weight: 18, volume: 82, body_type: 'Тент', truck_count: 1 },
  trading: {
    status: 'Auction',
    status_mobile: 'Leading',
    start_time: '2026-05-25T10:00:00',
    stop_time: '2026-05-26T10:00:00',
    bid_measurement_type: 'PerRoute',
    can_set_bet: true,
    is_bidder: true,
    is_available: true,
    price: { start: 40_000, current: 36_000, current_no_vat: 30_000 },
    your: { bet: true, last_bet: 36_000 },
  },
  payment: { form: 'Безналичный', currency_code: 'RUB' },
  ...overrides,
});

/**
 * Убирает поля из объекта.
 *
 * `exactOptionalPropertyTypes` запрещает писать `status: undefined`: «поля нет»
 * и «поле есть и равно undefined» — разные вещи, и DTO допускает только первое.
 */
const omit = <T extends object, K extends keyof T>(source: T, ...keys: K[]): Omit<T, K> =>
  Object.fromEntries(Object.entries(source).filter(([key]) => !keys.includes(key as K))) as Omit<
    T,
    K
  >;

describe('mapAuctionCard (㉚㉛)', () => {
  it('собирает ViewModel без опциональных полей', () => {
    const card = mapAuctionCard(listItem());

    expect(card.orderUid).toBe('auction-1001');
    expect(card.cargoNum).toBe('A-240001');
    expect(card.aucType.label).toBe('На понижение');
    expect(card.status.label).toBe('Торги идут');
    expect(card.tradingStatus.label).toBe('Лидирую');
    expect(card.route).toBe('Москва → Казань');
    expect(card.cargo.name).toBe('Бумага офисная');
    expect(card.hasMyBet).toBe(true);
  });

  it('цена печатается с единицей измерения (㉚)', () => {
    const perRoute = mapAuctionCard(listItem());

    expect(perRoute.price).toContain('за рейс');

    const base = listItem();
    const perKm = mapAuctionCard({
      ...base,
      trading: { ...base.trading, bid_measurement_type: 'PerKm' },
    });

    expect(perKm.price).toContain('₽/км');
    expect(perKm.price).not.toContain('за рейс');
  });

  it('без блока цены карточка не падает и не выдумывает ноль (㉛)', () => {
    const base = listItem();
    const card = mapAuctionCard({
      ...base,
      trading: { ...base.trading, price: null, your: null },
    });

    expect(card.price).toBe(DASH);
    expect(card.hasMyBet).toBe(false);
    // Цена за км при этом остаётся, если сервер её посчитал.
    expect(card.pricePerKm).not.toBe(DASH);
  });

  it('незнакомый статус деградирует до «Неизвестно», а не в пустоту (④)', () => {
    const base = listItem();
    const card = mapAuctionCard({
      ...base,
      trading: omit(base.trading ?? {}, 'status', 'status_mobile'),
    });

    expect(card.tradingStatus.label).toBe('Неизвестно');
    expect(card.status.label).toBe('Неизвестно');
  });

  it('пустые строки схемы превращаются в прочерк, а не в пустое место (⑫)', () => {
    const base = listItem();
    const card = mapAuctionCard({
      ...base,
      cargo: { ...base.cargo, name: '', body_type: '' },
      organizer: { organization_name: '', is_hide_organization: false },
    });

    expect(card.cargo.name).toBe(DASH);
    expect(card.cargo.bodyType).toBe(DASH);
    expect(card.organizer).toBe(DASH);
  });

  it('скрытый организатор не показывается (㉖)', () => {
    const card = mapAuctionCard(
      listItem({ organizer: { organization_name: 'АО «Секрет»', is_hide_organization: true } }),
    );

    expect(card.organizer).toBe('Скрыт организатором');
  });

  it('вес и объём форматируются с единицами, отсутствующие — прочерком', () => {
    const base = listItem();

    expect(mapAuctionCard(base).cargo.weight).toBe(`18${NBSP}т`);
    expect(mapAuctionCard({ ...base, cargo: omit(base.cargo ?? {}, 'weight') }).cargo.weight).toBe(
      DASH,
    );
  });
});
