import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ERROR_TRIGGER_UIDS, SEED_CASE_UIDS } from '@/mocks/seed';
import { resetStore } from '@/mocks/store';
import { type AuctionShowResponseDto, type BetListResponseDto } from '@/shared/api/dto';
import { auctionKeys } from '@/shared/api/query-keys';

import { renderRouteAt } from '../helpers/render-route';

/**
 * Маршруты с данными: что loader действительно **загрузил**, а не просто
 * отрендерил заголовок.
 *
 * Проверка идёт по кэшу запросов: `ensureQueryData` греет тот же ключ, который
 * потом читает страница, и наличие данных в кэше — прямое доказательство работы
 * loader'а. Заголовок доказывает только то, что компонент отрисовался: сломать
 * loader и оставить заголовок на месте очень легко.
 */
describe('маршруты аукциона: loader греет кэш', () => {
  beforeEach(() => {
    resetStore();
  });

  it('детальная грузится по order_uid, а не по id (⑱)', async () => {
    const uid = SEED_CASE_UIDS.biddableProlonged;
    const { router, queryClient } = await renderRouteAt(`/auctions/${uid}`);

    expect(router.state.matches.at(-1)?.routeId).toBe('/auctions/$auctionUuid/');

    const cached = queryClient.getQueryData<AuctionShowResponseDto>(auctionKeys.detail(uid));

    expect(cached?.main.order_uid).toBe(uid);
    expect(cached?.main.cargo_num).not.toBe('');
    // Заголовок собран из тех же данных — связь «loader → экран» замкнута.
    expect(
      await screen.findByRole('heading', { name: `Аукцион ${cached?.main.cargo_num ?? ''}` }),
    ).toBeInTheDocument();
  });

  it('ставки попадают в кэш вместе с отменёнными (㉙)', async () => {
    const uid = SEED_CASE_UIDS.withCanceledBets;
    const { queryClient } = await renderRouteAt(`/auctions/${uid}/bets`);

    // Ключ включает `all`: loader обязан просить именно вариант с отменёнными,
    // иначе требуемые заданием признак и причина отмены показать будет нечем.
    const cached = queryClient.getQueryData<BetListResponseDto>(
      auctionKeys.bets(uid, { all: true }),
    );

    expect(cached?.bets.length).toBeGreaterThan(0);
    expect(cached?.bets.some((bet) => (bet.cancel_reason ?? '') !== '')).toBe(true);
    expect(await screen.findByRole('heading', { name: 'Ставки' })).toBeInTheDocument();
  });

  it('при скрытой истории ставки не запрашиваются вовсе (⑩⑪)', async () => {
    // Скрытость — решение по данным detail: серверного кода на этот случай у
    // `GET /bets` нет, поэтому лишний запрос ловится именно пустым кэшем.
    const { queryClient } = await renderRouteAt(
      `/auctions/${SEED_CASE_UIDS.hiddenBetsHistory}/bets`,
    );

    expect(
      queryClient.getQueryData(auctionKeys.bets(SEED_CASE_UIDS.hiddenBetsHistory, { all: true })),
    ).toBeUndefined();
    expect(
      await screen.findByRole('heading', { name: 'История ставок скрыта' }),
    ).toBeInTheDocument();
  });
});

describe('доступность страницы ставки (⑧)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('при can_set_bet: false показывает ограничение вместо формы', async () => {
    const uid = SEED_CASE_UIDS.notBiddable;
    const { queryClient } = await renderRouteAt(`/auctions/${uid}/bet`);
    const cached = queryClient.getQueryData<AuctionShowResponseDto>(auctionKeys.detail(uid));

    // Решение принято по данным, а не по имени маршрута.
    expect(cached?.trading.can_set_bet).toBe(false);
    expect(await screen.findByRole('heading', { name: 'Ставка недоступна' })).toBeInTheDocument();
    // Формы на экране нет — это именно экран ограничения.
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ставк/iu })).not.toBeInTheDocument();
  });

  it('при can_set_bet: true открывает экран ставки', async () => {
    const uid = SEED_CASE_UIDS.biddableProlonged;
    const { queryClient } = await renderRouteAt(`/auctions/${uid}/bet`);
    const cached = queryClient.getQueryData<AuctionShowResponseDto>(auctionKeys.detail(uid));

    expect(cached?.trading.can_set_bet).toBe(true);
    expect(await screen.findByRole('heading', { name: 'Ставка' })).toBeInTheDocument();
  });
});

describe('экраны ошибок контракта (⑯⑰)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('404 показывает «Не найдено» и путь обратно к списку', async () => {
    await renderRouteAt('/auctions/нет-такого-аукциона');

    // waitFor + getBy, а не findBy: узел экрана ошибки пересоздаётся при
    // повторном рендере роутера, и найденная ранее ссылка успевает отвалиться
    // от документа до самой проверки.
    await waitFor(() => {
      expect(screen.getByText('Не найдено')).toBeInTheDocument();
    });
    // Тупик без выхода — это тоже сбой: у 404 обязана быть дорога назад.
    expect(screen.getByRole('link', { name: 'К списку аукционов' })).toBeInTheDocument();
  });

  it('401 показывает «Сессия истекла» без кнопки повтора', async () => {
    await renderRouteAt(`/auctions/${ERROR_TRIGGER_UIDS.unauthorized}`);

    await waitFor(() => {
      expect(screen.getByText('Сессия истекла')).toBeInTheDocument();
    });
    // Повторять 401 бессмысленно: нужна авторизация, а не ещё одна попытка.
    expect(screen.queryByRole('button', { name: 'Повторить' })).not.toBeInTheDocument();
  });

  it('503 показывает «Сервис недоступен» и предлагает повтор', async () => {
    await renderRouteAt(`/auctions/${ERROR_TRIGGER_UIDS.serviceUnavailable}`);

    await waitFor(() => {
      expect(screen.getByText('Сервис недоступен')).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });
});
