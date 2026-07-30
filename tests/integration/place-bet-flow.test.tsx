import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { getAuction } from '@/entities/auction';
import { postAuctionBet } from '@/entities/bet';
import { SEED_CASE_UIDS } from '@/mocks/seed';
import { server } from '@/mocks/server';
import { resetStore } from '@/mocks/store';
import { type AuctionShowResponseDto } from '@/shared/api/dto';
import { auctionKeys } from '@/shared/api/query-keys';
import { API_BASE_URL } from '@/shared/config/api.config';

import { renderRouteAt } from '../helpers/render-route';

/**
 * Сквозной сценарий установки ставки (8.5) — единственное место, где форма,
 * мутация, инвалидация и переход на детальную проверяются вместе, а не по
 * отдельности юнит-тестами `create-bet-schema`/`map-validation-errors`.
 *
 * Аукцион-якорь — тот же, что и в `mocks-bet-flow.test.ts`: торги на
 * понижение (`Down`), ставить можно, продление задано. Общий якорь позволяет
 * читать ожидаемые числа (`step`, `current`) одинаково в обоих файлах.
 */
describe('Форма ставки — сквозной сценарий (8.5)', () => {
  beforeEach(() => {
    resetStore();
  });

  const orderUid = SEED_CASE_UIDS.biddableProlonged;

  it('успешная ставка обновляет detail и возвращает на страницу аукциона', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const current = before.trading.price?.current ?? 0;
    // Аукцион на понижение: ставка обязана быть ниже текущей цены (§8.2).
    const myPrice = current - step;

    const { router } = await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    await user.clear(priceInput);
    await user.type(priceInput, String(myPrice));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    // Переход на детальную — прямое доказательство успеха мутации, а не догадка по тосту.
    await waitFor(() => {
      expect(router.state.matches.at(-1)?.routeId).toBe('/auctions/$auctionUuid/');
    });

    const after = await getAuction(orderUid);

    expect(after.trading.price?.current).toBe(myPrice);
    expect(after.trading.your?.bet).toBe(true);
  });

  it('после успеха показывает toast и инвалидирует кэш detail', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const myPrice = (before.trading.price?.current ?? 0) - step;

    const { queryClient } = await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    await user.clear(priceInput);
    await user.type(priceInput, String(myPrice));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    // Требование задания «success toast» — проверяется на экране, а не по коду.
    expect(await screen.findByRole('alert')).toHaveTextContent('Ставка принята.');

    // Требование «после успеха инвалидируются list/detail/bets»: доказательство
    // — обновившийся кэш активного запроса, а не сам факт вызова invalidate.
    await waitFor(() => {
      const cached = queryClient.getQueryData<AuctionShowResponseDto>(auctionKeys.detail(orderUid));

      expect(cached?.trading.price?.current).toBe(myPrice);
    });
  });

  it('422 от MSW показывается под полем: цену сдвинул другой участник', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const current = before.trading.price?.current ?? 0;

    await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    // Пока форма открыта, конкурент перебил цену — кэш detail устарел.
    await postAuctionBet({ auctionUuid: orderUid, price: current - step });

    // Клиентская схема сравнивает с устаревшим `current`, поэтому пропускает
    // цену, которую MSW-валидация уже обязана отклонить. 422 приходит из
    // обычного хендлера мока, не подменённого на время теста (⑯).
    await user.clear(priceInput);
    await user.type(priceInput, String(current - step));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    expect(
      await screen.findByText(/цена должна быть ниже/iu, { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it('цена не ниже текущей отклоняется на клиенте — запрос не уходит', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);
    const current = before.trading.price?.current ?? 0;

    await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    await user.clear(priceInput);
    await user.type(priceInput, String(current));
    await user.tab();

    expect(
      await screen.findByText(/Аукцион на понижение: цена должна быть ниже/iu),
    ).toBeInTheDocument();

    const after = await getAuction(orderUid);

    // Состояние мока не изменилось — запрос действительно не отправлялся.
    expect(after.trading.price?.current).toBe(current);
  });

  it('пустое поле цены не отправляет запрос — цена обязательна', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);

    await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    await user.clear(priceInput);
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    expect(await screen.findByText('Введите цену.')).toBeInTheDocument();

    const after = await getAuction(orderUid);

    expect(after.trading.price?.current).toBe(before.trading.price?.current);
  });

  it('ошибка MSW вне 422 уходит в error-toast, а не под поле', async () => {
    const user = userEvent.setup();
    const before = await getAuction(orderUid);
    const step = before.trading.price?.step ?? 500;
    const myPrice = (before.trading.price?.current ?? 0) - step;

    await renderRouteAt(`/auctions/${orderUid}/bet`);

    const priceInput = await screen.findByRole('spinbutton', { name: 'Цена ставки' });

    // 503 подменяется точечно: триггеры ошибок в сиде привязаны к аукциону и
    // срабатывают ещё в loader'е, то есть до формы, — ветку мутации ими не достать.
    server.use(
      http.post(`${API_BASE_URL}/auctions/:auctionUuid/bets`, () =>
        HttpResponse.json(
          {
            code: 'service_unavailable',
            title: 'Сервис недоступен',
            message: 'Upstream временно недоступен.',
          },
          { status: 503 },
        ),
      ),
    );

    await user.clear(priceInput);
    await user.type(priceInput, String(myPrice));
    await user.click(screen.getByRole('button', { name: 'Отправить ставку' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Upstream временно недоступен.');
  });

  it('форма недоступна без права на ставку — маршрут показывает объяснение (8.1)', async () => {
    await renderRouteAt(`/auctions/${SEED_CASE_UIDS.notBiddable}/bet`);

    expect(await screen.findByRole('heading', { name: 'Ставка недоступна' })).toBeInTheDocument();
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: /Назад к аукциону/iu });

    expect(within(backLink).getByText(/Назад/iu)).toBeInTheDocument();
  });
});
