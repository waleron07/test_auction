import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { SEED_CASE_UIDS } from '@/mocks/seed';
import { resetStore } from '@/mocks/store';

import { renderRouteAt } from '../helpers/render-route';

/**
 * Сквозная навигация: с любого экрана есть дорога к списку.
 *
 * До появления шапки её не было ни на одном — карточка вела в глубину, а
 * обратно можно было только кнопкой браузера. Проверяются именно **разные**
 * маршруты: пробел был общим, поэтому и тест общий, а не про одну страницу.
 */
describe('Шапка приложения — дорога назад к списку', () => {
  beforeEach(() => {
    resetStore();
  });

  const uid = SEED_CASE_UIDS.biddableProlonged;

  it.each([
    ['детальной', `/auctions/${uid}`],
    ['истории ставок', `/auctions/${uid}/bets`],
    ['формы ставки', `/auctions/${uid}/bet`],
  ])('с %s есть ссылка на список, и она работает', async (_name, path) => {
    const user = userEvent.setup();
    const { router } = await renderRouteAt(path);

    const homeLink = await screen.findByRole('link', { name: 'Грузовые аукционы' });

    await user.click(homeLink);

    await waitFor(() => {
      expect(router.state.matches.at(-1)?.routeId).toBe('/auctions/');
    });
  });

  it('на самом списке ссылка тоже есть — шапка одна на все маршруты', async () => {
    await renderRouteAt('/auctions');

    expect(await screen.findByRole('link', { name: 'Грузовые аукционы' })).toBeInTheDocument();
  });

  it('шапка переживает экран ошибки: 401 не оставляет пользователя без навигации', async () => {
    await renderRouteAt('/auctions/auction-401-unauthorized');

    expect(await screen.findByRole('link', { name: 'Грузовые аукционы' })).toBeInTheDocument();
  });

  it('на списке таб помечен активным', async () => {
    await renderRouteAt('/auctions');

    const link = await screen.findByRole('link', { name: 'Грузовые аукционы' });

    // Цвет проверить в jsdom нечем, но подсветка навешивается по этой разметке:
    // стиль в `sx` селектится ровно по `data-status`, а `aria-current` — то же
    // состояние для скринридера.
    expect(link).toHaveAttribute('data-status', 'active');
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it.each([
    ['детальной', `/auctions/${uid}`],
    ['истории ставок', `/auctions/${uid}/bets`],
  ])('на %s таб НЕ активен — подсветка отличает «вы здесь» от «дороги назад»', async (_n, path) => {
    await renderRouteAt(path);

    const link = await screen.findByRole('link', { name: 'Грузовые аукционы' });

    // Без `exact` роутер считал бы ссылку активной и здесь (префиксное
    // совпадение `/auctions`), и подсветка горела бы всегда, ничего не сообщая.
    expect(link).not.toHaveAttribute('data-status', 'active');
    expect(link).not.toHaveAttribute('aria-current');
  });
});
