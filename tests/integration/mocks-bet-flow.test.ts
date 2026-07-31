import { beforeEach, describe, expect, it } from 'vitest';

import { getAuction, postAuctionsList } from '@/entities/auction';
import { getAuctionBets, postAuctionBet } from '@/entities/bet';
import { isBetCanceled } from '@/mocks/lib/bet-ranking.util';
import { ERROR_TRIGGER_UIDS, SEED_CASE_UIDS } from '@/mocks/seed';
import { CURRENT_USER, resetStore } from '@/mocks/store';

/**
 * Сквозной сценарий ставки против MSW — критерий готовности фазы 3.
 *
 * Тесты идут через реальный слой запросов (`shared/api/http` + функции запросов
 * сущностей), а не через прямые вызовы стора: проверяется связка
 * «клиент → HTTP → мок → клиент» целиком, включая разбор ошибок и сериализацию
 * query-параметров. Прямой вызов мутатора подтвердил бы только сам мутатор.
 */
describe('MSW: состояние меняется после ставки', () => {
  beforeEach(() => {
    // Стор изменяемый: без сброса ставка из предыдущего теста утекает в следующий.
    resetStore();
  });

  /** Аукцион-якорь: торги на понижение, ставить можно, продление задано. */
  const orderUid = SEED_CASE_UIDS.biddableProlonged;

  it('ставка меняет current, место в рейтинге и торговый статус', async () => {
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const currentBefore = before.trading.price?.current ?? 0;

    expect(before.trading.your?.bet).toBe(false);

    // Аукцион на понижение: ставка обязана быть ниже текущей цены.
    const myPrice = currentBefore - step;

    await postAuctionBet({ auctionUuid: orderUid, price: myPrice });

    const after = await getAuction(orderUid);

    expect(after.trading.price?.current).toBe(myPrice);
    expect(after.trading.your?.bet).toBe(true);
    expect(after.trading.your?.last_bet).toBe(myPrice);
    // База НДС отправленной ставки фиксируется в ответе (⑧).
    expect(after.trading.is_last_bet_with_vat).toBe(true);
    // Лучшая цена на понижение — моя, значит статус «Лидирую».
    expect(after.trading.status_mobile).toBe('Leading');

    const bets = await getAuctionBets({ auctionUuid: orderUid, all: true });
    const myBet = bets.bets.find((bet) => bet.price_with_vat === myPrice);

    expect(myBet?.place).toBe(1);
    expect(myBet?.is_win).toBe(true);
    // Цена без НДС пересчитана, а не скопирована.
    expect(myBet?.price_no_vat).toBeLessThan(myPrice);
  });

  it('повторный запрос отдаёт новое состояние, а не сид', async () => {
    const first = await getAuction(orderUid);
    const step = first.trading.price?.step ?? 500;
    const price = (first.trading.price?.current ?? 0) - step;

    await postAuctionBet({ auctionUuid: orderUid, price });

    const second = await getAuction(orderUid);
    const third = await getAuction(orderUid);

    expect(second.trading.price?.current).toBe(price);
    expect(third.trading.price?.current).toBe(price);
    expect(third.trading.price?.current).not.toBe(first.trading.price?.current);
  });

  it('список видит ту же ставку — проекции не разъезжаются', async () => {
    const detail = await getAuction(orderUid);
    const step = detail.trading.price?.step ?? 500;
    const price = (detail.trading.price?.current ?? 0) - step;

    await postAuctionBet({ auctionUuid: orderUid, price });

    const response = await postAuctionsList({ page: 1, per_page: 100 });
    const item = response.data?.find((candidate) => candidate.main?.order_uid === orderUid);

    expect(item?.trading?.price?.current).toBe(price);
    expect(item?.trading?.your?.bet).toBe(true);
    expect(item?.trading?.status_mobile).toBe('Leading');
    // В проекции списка у `your` только два поля: остальных там нет по схеме (㉒).
    expect(Object.keys(item?.trading?.your ?? {}).sort()).toEqual(['bet', 'last_bet']);
  });

  it('время торгов продлевается, если prolong_after_bet задан', async () => {
    const detail = await getAuction(orderUid);

    expect(detail.trading.settings?.prolong_after_bet).not.toBeNull();

    const stopBefore = detail.trading.stop_time;
    const price = (detail.trading.price?.current ?? 0) - (detail.trading.price?.step ?? 0);

    await postAuctionBet({ auctionUuid: orderUid, price });

    const after = await getAuction(orderUid);

    expect(after.trading.stop_time).not.toBe(stopBefore);
  });
});

describe('MSW: current — цена лучшей ставки, а не последней (регрессия)', () => {
  beforeEach(() => {
    resetStore();
  });

  /**
   * Дефект, найденный на демонстрации: на аукционе **на повышение** перевозчик
   * ставил допустимую цену и получал «Проигрываю» при том, что `current` был
   * равен его же ставке. Причина — в сиде ни одна ставка не стояла на текущей
   * цене: все были выше `current` независимо от типа торгов, поэтому у `Up`
   * лучшая (максимальная) ставка не совпадала с `current`.
   */
  it('на аукционе Up ставка выше текущей делает лидером, а не проигрывающим', async () => {
    const list = await postAuctionsList({ page: 1, per_page: 100 });
    const item = list.data?.find(
      (candidate) => candidate.main?.auc_type === 'Up' && candidate.trading?.can_set_bet === true,
    );
    const orderUid = item?.main?.order_uid ?? '';
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const myPrice = (before.trading.price?.current ?? 0) + step;

    await postAuctionBet({ auctionUuid: orderUid, price: myPrice });

    const after = await getAuction(orderUid);

    expect(after.trading.status_mobile).toBe('Leading');
    expect(after.trading.price?.current).toBe(myPrice);
    expect(after.trading.your?.win).toBe(true);
  });

  it.each(['Request', 'Up', 'Down', 'FixPrice'])(
    'в сиде %s текущая цена совпадает с ценой лидирующей ставки',
    async (aucType) => {
      const list = await postAuctionsList({ page: 1, per_page: 100 });
      // Аукционы-триггеры ошибок исключены: они по замыслу отвечают 401/503 на
      // любой запрос, и обойти их означало бы проверять не инвариант сида (⑰).
      const triggers = new Set<string>(Object.values(ERROR_TRIGGER_UIDS));
      const items = (list.data ?? []).filter(
        (candidate) =>
          candidate.main?.auc_type === aucType && !triggers.has(candidate.main.order_uid ?? ''),
      );

      expect(items.length).toBeGreaterThan(0);

      for (const item of items) {
        const orderUid = item.main?.order_uid ?? '';
        const { bets } = await getAuctionBets({ auctionUuid: orderUid, all: true });
        const winner = bets.find((bet) => bet.place === 1);

        if (winner === undefined) continue;

        const detail = await getAuction(orderUid);

        expect(detail.trading.price?.current).toBe(winner.price_with_vat);
      }
    },
  );

  it('несколько своих ставок подряд накапливаются в истории', async () => {
    const orderUid = SEED_CASE_UIDS.biddableProlonged;
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    let price = before.trading.price?.current ?? 0;

    for (let index = 0; index < 3; index += 1) {
      price -= step;
      await postAuctionBet({ auctionUuid: orderUid, price });
    }

    const { bets } = await getAuctionBets({ auctionUuid: orderUid, all: true });
    const mine = bets.filter((bet) => bet.subscriber_id === CURRENT_USER.subscriberId);

    // Ставки именно накапливаются, а не заменяют друг друга: история торгов —
    // это все ставки, а не последняя от каждого участника.
    expect(mine).toHaveLength(3);
    expect(mine.map((bet) => bet.price_with_vat)).toEqual([price + 2 * step, price + step, price]);
  });
});

describe('MSW: параметр all у GET /bets (㉙)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('без all отменённые ставки не приходят, с all — приходят', async () => {
    const auctionUuid = SEED_CASE_UIDS.withCanceledBets;
    const [withAll, withoutAll] = await Promise.all([
      getAuctionBets({ auctionUuid, all: true }),
      getAuctionBets({ auctionUuid, all: false }),
    ]);
    // Предикат отмены берётся из моков, а не переписывается: копия правила в
    // тесте означала бы, что тест проверяет сам себя (⑫).
    const canceled = withAll.bets.filter(isBetCanceled);

    expect(canceled.length).toBeGreaterThan(0);
    expect(withoutAll.bets.length).toBeLessThan(withAll.bets.length);
    expect(withoutAll.bets.some(isBetCanceled)).toBe(false);
    // Причина отмены доступна — требование задания выполнимо только с all.
    expect(canceled.some((bet) => (bet.cancel_reason ?? '') !== '')).toBe(true);
    // Отменённая ставка места не занимает.
    expect(canceled.every((bet) => bet.place === null)).toBe(true);
  });
});

describe('MSW: фильтры работают по канонической сущности (①③)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('фильтр status находит статусы, которых нет в проекции списка', async () => {
    // `AuctionListRequest.status` принимает все 9 значений TradingStatus, а
    // проекция списка знает только 6 (③). Фильтрация по проекции отвечала бы
    // «ничего не найдено» на легальный запрос.
    const response = await postAuctionsList({ page: 1, per_page: 100, status: ['OnPending'] });

    expect(response.data?.length).toBeGreaterThan(0);
    // В самой выдаче статус при этом вырожден до Unknown — контракт списка.
    expect(response.data?.[0]?.trading?.status_mobile).toBe('Unknown');
  });

  it('аукцион без блока цены в списке остаётся видимым для фильтра по цене', async () => {
    // trading.price: null существует только в проекции (㉛): фильтрация по
    // проекции прятала бы такой аукцион от любого ценового фильтра.
    const all = await postAuctionsList({ page: 1, per_page: 100 });
    const nullPriceItem = all.data?.find((item) => item.trading?.price === null);

    expect(nullPriceItem).toBeDefined();

    const filtered = await postAuctionsList({ page: 1, per_page: 100, current_price_from: 1 });

    expect(
      filtered.data?.some((item) => item.main?.order_uid === nullPriceItem?.main?.order_uid),
    ).toBe(true);
  });
});
