import { describe, expect, it } from 'vitest';

import { type AuctionShowResponseDto } from '@/shared/api/dto';
import { DASH, NBSP } from '@/shared/lib/string/typography.const';

import { mapAuctionDetail } from './map-auction-detail.util';

/** Минимальный, но валидный detail: остальное дописывают тесты через overrides. */
const detail = (overrides: Partial<AuctionShowResponseDto> = {}): AuctionShowResponseDto => ({
  main: {
    order_uid: 'auction-1001',
    cargo_num: 'A-240001',
    auc_type: 'Down',
    created_at: '2026-05-25T09:00:00',
  },
  organizer: { organization_name: 'АО «Грузовладелец»', organization_inn: '7703769184' },
  contacts: [],
  cargo: {
    price: '120000',
    body_type: 'Тент',
    truck_count: 1,
    distance: 1500,
    loading_types: { side: true, top: false, rear: true, full: false },
    docs: { tir: false, cmr: true, t1: false, med: false },
  },
  trading: {
    status: 'Auction',
    status_mobile: 'NotParticipating',
    start_time: '2026-05-25T10:00:00',
    stop_time: '2026-05-26T10:00:00',
    bid_measurement_type: 'PerRoute',
    can_set_bet: true,
    price: {
      current: 36_000,
      current_no_vat: 30_000,
      available: 35_500,
      available_no_vat: 29_583.33,
      min: 20_000,
      min_no_vat: 16_666.67,
      max: 40_000,
      max_no_vat: 33_333.33,
      step: 500,
      step_no_vat: 416.67,
    },
    your: { bet: false, last_bet: null, last_bet_with_vat: null, win: false },
    settings: { prolong_after_bet: 10 },
  },
  payment: { form: 'Безналичный', delay: 30, delay_type: 'CalendarDays' },
  assembly: {},
  routes: [
    {
      op_type: 'Loading',
      start_date: '2026-05-26T09:00:00',
      end_date: '2026-05-26T18:00:00',
      location: { city_name: 'Москва', loading_address: 'ул. Складская, 10' },
      cargo: { name: 'Бумага офисная' },
      contact: { name: 'Петров П.', phone: '+7 900 111-22-33' },
    },
    {
      op_type: 'Unloading',
      start_date: '2026-05-27T18:00:00',
      end_date: '2026-05-27T20:00:00',
      location: { city_name: 'Казань', loading_address: 'пр. Промышленный, 4' },
      cargo: { name: 'Бумага офисная' },
      contact: { name: 'Сидоров С.', phone: '+7 900 222-33-44' },
    },
  ],
  admitted_organizations: [],
  ...overrides,
});

describe('mapAuctionDetail: базовая сборка', () => {
  it('собирает ViewModel без опциональных полей', () => {
    const vm = mapAuctionDetail(detail(), 'with');

    expect(vm.orderUid).toBe('auction-1001');
    expect(vm.cargoNum).toBe('A-240001');
    expect(vm.aucType.label).toBe('На понижение');
    expect(vm.organizer.name).toBe('АО «Грузовладелец»');
    expect(vm.route).toHaveLength(2);
  });

  it('createdAt форматируется как дата, а не остаётся сырой строкой', () => {
    expect(mapAuctionDetail(detail(), 'with').createdAt).toBe('25 мая, 09:00');
  });

  it('createdAt: пустая строка (⑫) даёт прочерк', () => {
    const withoutCreatedAt = detail({ main: { ...detail().main, created_at: '' } });

    expect(mapAuctionDetail(withoutCreatedAt, 'with').createdAt).toBe(DASH);
  });

  it('permissions делегируются mapAuctionPermissions, а не пересчитываются заново', () => {
    const vm = mapAuctionDetail(
      detail({ trading: detail().trading, hide_bets_history: true }),
      'with',
    );

    expect(vm.permissions.hideBetsHistory).toBe(true);
    expect(vm.permissions.canSetBet).toBe(true);
  });
});

describe('mapAuctionDetail: название и цена груза', () => {
  it('название груза собирается из точек маршрута (㉔): detail само его не содержит', () => {
    expect(mapAuctionDetail(detail(), 'with').cargo.name).toBe('Бумага офисная');
  });

  it('расходящиеся названия по точкам перечисляются, а не выбирается одно', () => {
    const base = detail();
    const withDifferentCargo = detail({
      routes: [
        { ...(base.routes[0] ?? {}), cargo: { name: 'Бумага офисная' } },
        { ...(base.routes[1] ?? {}), cargo: { name: 'Картон' } },
      ],
    });

    expect(mapAuctionDetail(withDifferentCargo, 'with').cargo.name).toBe('Бумага офисная / Картон');
  });

  it('цена груза скрывается текстом, когда действует no_view_cargo_price', () => {
    const hidden = detail({ trading: { ...detail().trading, no_view_cargo_price: true } });

    expect(mapAuctionDetail(hidden, 'with').cargo.price).toBe('Скрыто организатором');
  });

  it('цена груза — строка в схеме (㉕), но в ViewModel уже отформатированное число', () => {
    expect(mapAuctionDetail(detail(), 'with').cargo.price).toBe(`120${NBSP}000${NBSP}₽`);
  });
});

describe('mapAuctionDetail: детали груза', () => {
  it('оставляет только включённые способы погрузки', () => {
    // Фикстура: side true, top false, rear true, full false.
    expect(mapAuctionDetail(detail(), 'with').cargo.loadingTypes).toEqual(['Боковая', 'Задняя']);
  });

  it('способов погрузки нет — пустой массив, а не список из четырёх «нет»', () => {
    const withoutTypes = detail({
      cargo: { ...detail().cargo, loading_types: { side: false, top: false, rear: false, full: false } },
    });

    expect(mapAuctionDetail(withoutTypes, 'with').cargo.loadingTypes).toEqual([]);
  });

  it('оставляет только требуемые документы', () => {
    // Фикстура: tir false, cmr true, t1 false, med false.
    expect(mapAuctionDetail(detail(), 'with').cargo.docs).toEqual(['CMR']);
  });

  it('bodyType: пустая строка (⑫) даёт прочерк', () => {
    const withoutBodyType = detail({ cargo: { ...detail().cargo, body_type: '' } });

    expect(mapAuctionDetail(withoutBodyType, 'with').cargo.bodyType).toBe(DASH);
  });

  it('truckCount: если truck_count отсутствует, используется 1', () => {
    const cargo = { ...detail().cargo };

    delete cargo.truck_count;

    expect(mapAuctionDetail(detail({ cargo }), 'with').cargo.truckCount).toBe(1);
  });

  it('truckCount: явно заданное значение не заменяется дефолтом', () => {
    const withTruckCount = detail({ cargo: { ...detail().cargo, truck_count: 3 } });

    expect(mapAuctionDetail(withTruckCount, 'with').cargo.truckCount).toBe(3);
  });

  it('distance: число с единицей измерения', () => {
    // Фикстура: distance 1500.
    expect(mapAuctionDetail(detail(), 'with').cargo.distance).toBe(`1500${NBSP}км`);
  });

  it('distance: не задано — прочерк', () => {
    const cargo = { ...detail().cargo };

    delete cargo.distance;

    expect(mapAuctionDetail(detail({ cargo }), 'with').cargo.distance).toBe(DASH);
  });
});

describe('mapAuctionDetail: организатор и контакты', () => {
  it('организатор: инн передаётся наравне с названием', () => {
    expect(mapAuctionDetail(detail(), 'with').organizer.inn).toBe('7703769184');
  });

  it('организатор: пустая строка (⑫) даёт прочерк, а не пустое поле', () => {
    const withoutOrganizer = detail({
      organizer: { organization_name: '', organization_inn: '' },
    });
    const vm = mapAuctionDetail(withoutOrganizer, 'with');

    expect(vm.organizer.name).toBe(DASH);
    expect(vm.organizer.inn).toBe(DASH);
  });

  it('контакты организатора маппятся построчно', () => {
    const withContacts = detail({
      contacts: [{ name: 'Иван Иванов', phone: '+7 999 000-00-00', email: 'ivan@example.ru' }],
    });

    expect(mapAuctionDetail(withContacts, 'with').contacts).toEqual([
      { name: 'Иван Иванов', phone: '+7 999 000-00-00', email: 'ivan@example.ru' },
    ]);
  });

  it('контакт с пустыми полями (⑫) даёт прочерк на каждом', () => {
    const withEmptyContact = detail({ contacts: [{ name: '', phone: '', email: '' }] });

    expect(mapAuctionDetail(withEmptyContact, 'with').contacts).toEqual([
      { name: DASH, phone: DASH, email: DASH },
    ]);
  });

  it('контактов нет — пустой массив, а не заглушка: это данные, а не сокрытие', () => {
    expect(mapAuctionDetail(detail(), 'with').contacts).toEqual([]);
  });
});

describe('mapAuctionDetail: требования к ТС', () => {
  it('car: null, если требований нет вовсе', () => {
    expect(mapAuctionDetail(detail(), 'with').cargo.car).toBeNull();
  });

  it('car собирает габариты в одну строку, когда все размеры заданы', () => {
    const withCar = detail({
      cargo: {
        ...detail().cargo,
        car: { type: 'Тягач', weight: 20, length: 13.6, width: 2.45, height: 2.7 },
      },
    });

    expect(mapAuctionDetail(withCar, 'with').cargo.car).toEqual({
      type: 'Тягач',
      weight: `20${NBSP}т`,
      volume: DASH,
      dimensions: '13.6 × 2.45 × 2.7 м',
    });
  });

  it('car нулевой по схеме (CarRequirements | null) — тоже null, а не падение', () => {
    const withNullCar = detail({ cargo: { ...detail().cargo, car: null } });

    expect(mapAuctionDetail(withNullCar, 'with').cargo.car).toBeNull();
  });

  it('car.volume — число с единицей измерения, а не всегда прочерк', () => {
    const withVolume = detail({
      cargo: { ...detail().cargo, car: { type: 'Тягач', volume: 82 } },
    });

    expect(mapAuctionDetail(withVolume, 'with').cargo.car?.volume).toBe(`82${NBSP}м³`);
  });
});

describe('mapAuctionDetail: точки маршрута', () => {
  it('адрес и контакт скрываются текстом при hide_points_address_and_contacts (㉗)', () => {
    const hidden = detail({
      trading: { ...detail().trading, hide_points_address_and_contacts: true },
    });
    const vm = mapAuctionDetail(hidden, 'with');

    expect(vm.route[0]?.address).toBe('Скрыто организатором');
    expect(vm.route[0]?.contactName).toBe('Скрыто организатором');
    expect(vm.route[0]?.contactPhone).toBe('Скрыто организатором');
    // Город точки — не адрес и не контакт, флаг его не касается.
    expect(vm.route[0]?.city).toBe('Москва');
  });

  it('пустая строка контакта (⑫) даёт прочерк, а не скрытие организатором', () => {
    const base = detail();
    const withEmptyContact = detail({
      routes: [{ ...(base.routes[0] ?? {}), contact: { name: '', phone: '' } }],
    });

    expect(mapAuctionDetail(withEmptyContact, 'with').route[0]?.contactName).toBe(DASH);
  });

  it('незнакомый op_type деградирует до «Неизвестно» (④)', () => {
    const base = detail();
    const point = { ...(base.routes[0] ?? {}) };

    delete point.op_type;

    const withUnknownOp = detail({ routes: [point] });

    expect(mapAuctionDetail(withUnknownOp, 'with').route[0]?.operation.label).toBe('Неизвестно');
  });
});

describe('mapAuctionDetail: цены и режим НДС', () => {
  it('режим «с НДС» показывает базовые значения', () => {
    const vm = mapAuctionDetail(detail(), 'with');

    expect(vm.trading.current.text).toBe(`36${NBSP}000${NBSP}₽${NBSP}за рейс`);
    expect(vm.trading.current.isFallback).toBe(false);
  });

  it('режим «без НДС» показывает пару *_no_vat', () => {
    const vm = mapAuctionDetail(detail(), 'without');

    expect(vm.trading.current.text).toBe(`30${NBSP}000${NBSP}₽${NBSP}за рейс`);
    // 29 583.33 округляется до рубля обычным правилом formatMoney.
    expect(vm.trading.available.text).toBe(`29${NBSP}583${NBSP}₽${NBSP}за рейс`);
  });

  it('min/max/step показываются как прочерк, если поля нет — компонент не ветвится (㉛)', () => {
    const withoutLimits = detail({
      trading: {
        ...detail().trading,
        price: { current: 36_000, current_no_vat: 30_000 },
      },
    });
    const vm = mapAuctionDetail(withoutLimits, 'with');

    expect(vm.trading.min.text).toBe(DASH);
    expect(vm.trading.max.text).toBe(DASH);
    expect(vm.trading.step.text).toBe(DASH);
  });

  it('цена печатается с единицей измерения — при PerKm иначе (㉚)', () => {
    const perKm = detail({ trading: { ...detail().trading, bid_measurement_type: 'PerKm' } });

    expect(mapAuctionDetail(perKm, 'with').trading.current.text).toBe(`36${NBSP}000${NBSP}₽/км`);
  });

  it('pricePerKm: число форматируется с единицей измерения', () => {
    const withPricePerKm = detail({
      trading: { ...detail().trading, price: { ...detail().trading.price, price_per_km: 1500 } },
    });

    expect(mapAuctionDetail(withPricePerKm, 'with').trading.pricePerKm).toBe(`1${NBSP}500${NBSP}₽/км`);
  });

  it('pricePerKm: не задано — прочерк', () => {
    expect(mapAuctionDetail(detail(), 'with').trading.pricePerKm).toBe(DASH);
  });
});

describe('mapAuctionDetail: флаги и настройки торгов', () => {
  it('allowCounterBets: true передаётся как есть', () => {
    const withCounterBets = detail({ trading: { ...detail().trading, allow_counter_bets: true } });

    expect(mapAuctionDetail(withCounterBets, 'with').trading.allowCounterBets).toBe(true);
  });

  it('allowCounterBets: не задано — false, а не undefined', () => {
    expect(mapAuctionDetail(detail(), 'with').trading.allowCounterBets).toBe(false);
  });

  it('prolongAfterBetMinutes: значение из settings передаётся как есть', () => {
    // Фикстура: settings.prolong_after_bet = 10.
    expect(mapAuctionDetail(detail(), 'with').trading.prolongAfterBetMinutes).toBe(10);
  });

  it('prolongAfterBetMinutes: settings не заданы — null, а не undefined', () => {
    const trading = { ...detail().trading };

    delete trading.settings;

    expect(mapAuctionDetail(detail({ trading }), 'with').trading.prolongAfterBetMinutes).toBeNull();
  });
});

describe('mapAuctionDetail: своя ставка', () => {
  it('ставки не было — hasMyBet false, сумма прочерком', () => {
    const vm = mapAuctionDetail(detail(), 'with');

    expect(vm.trading.hasMyBet).toBe(false);
    expect(vm.trading.myBet.text).toBe(DASH);
    expect(vm.trading.isWinner).toBe(false);
  });

  it('last_bet_with_vat — база «с НДС», last_bet — «без НДС»', () => {
    // Обратный контракту порядок суффиксов: обычно `X`/`X_no_vat`, здесь
    // `last_bet`/`last_bet_with_vat`. Читаем по буквальному смыслу имени поля:
    // `last_bet_with_vat` содержит сумму с НДС, `last_bet` — без.
    const withBet = detail({
      trading: {
        ...detail().trading,
        your: { bet: true, last_bet: 30_000, last_bet_with_vat: 36_000, win: true },
      },
    });

    const withVat = mapAuctionDetail(withBet, 'with');
    const withoutVat = mapAuctionDetail(withBet, 'without');

    expect(withVat.trading.hasMyBet).toBe(true);
    expect(withVat.trading.myBet.text).toBe(`36${NBSP}000${NBSP}₽${NBSP}за рейс`);
    expect(withoutVat.trading.myBet.text).toBe(`30${NBSP}000${NBSP}₽${NBSP}за рейс`);
    expect(withVat.trading.isWinner).toBe(true);
  });
});

describe('mapAuctionDetail: оплата, сборка, допущенные организации', () => {
  it('форма оплаты передаётся как есть', () => {
    expect(mapAuctionDetail(detail(), 'with').payment.form).toBe('Безналичный');
  });

  it('форма оплаты: пустая строка (⑫) даёт прочерк', () => {
    const withoutForm = detail({ payment: { ...detail().payment, form: '' } });

    expect(mapAuctionDetail(withoutForm, 'with').payment.form).toBe(DASH);
  });

  it('условие оплаты передаётся как есть', () => {
    const withCondition = detail({ payment: { ...detail().payment, condition: 'Оплата по факту' } });

    expect(mapAuctionDetail(withCondition, 'with').payment.condition).toBe('Оплата по факту');
  });

  it('условие оплаты не задано — прочерк', () => {
    expect(mapAuctionDetail(detail(), 'with').payment.condition).toBe(DASH);
  });

  it('отсрочка платежа форматируется с типом (родительный падеж)', () => {
    expect(mapAuctionDetail(detail(), 'with').payment.delay).toBe('30 календарных дней');
  });

  it('отсрочки нет — прочерк, а не «undefined календарных дней»', () => {
    const withoutDelay = detail({ payment: { ...detail().payment, delay: null } });

    expect(mapAuctionDetail(withoutDelay, 'with').payment.delay).toBe(DASH);
  });

  it('предоплата: число форматируется деньгами', () => {
    const withPrepay = detail({ payment: { ...detail().payment, prepay: '15000' } });

    expect(mapAuctionDetail(withPrepay, 'with').payment.prepay).toBe(`15${NBSP}000${NBSP}₽`);
  });

  it('предоплата: null — прочерк', () => {
    const withoutPrepay = detail({ payment: { ...detail().payment, prepay: null } });

    expect(mapAuctionDetail(withoutPrepay, 'with').payment.prepay).toBe(DASH);
  });

  it('предоплата: undefined — тоже прочерк', () => {
    expect(mapAuctionDetail(detail(), 'with').payment.prepay).toBe(DASH);
  });

  it('assembly: null, если ни номера, ни даты нет', () => {
    expect(mapAuctionDetail(detail(), 'with').assembly).toBeNull();
  });

  it('assembly: объект, если хотя бы номер задан', () => {
    const withAssembly = detail({ assembly: { num: 'SB-1001', date: '2026-05-26T09:00:00' } });

    expect(mapAuctionDetail(withAssembly, 'with').assembly).toEqual({
      num: 'SB-1001',
      date: '26 мая, 09:00',
    });
  });

  it('assembly: номер задан, даты нет — дата остаётся прочерком, а не null-объектом', () => {
    const withNumOnly = detail({ assembly: { num: 'SB-1002' } });

    expect(mapAuctionDetail(withNumOnly, 'with').assembly).toEqual({
      num: 'SB-1002',
      date: DASH,
    });
  });

  it('допущенные организации маппятся построчно', () => {
    const withOrgs = detail({
      admitted_organizations: [{ name: 'ООО «Перевозчик»', inn: '7700123456', is_main: true }],
    });

    expect(mapAuctionDetail(withOrgs, 'with').admittedOrganizations).toEqual([
      { name: 'ООО «Перевозчик»', inn: '7700123456', isMain: true },
    ]);
  });
});
