import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetStore } from '@/mocks/store';

import { renderRouteAt } from '../helpers/render-route';

/** Карточки списка помечены ролью article — по ней их и считаем. */
const findCards = async (): Promise<HTMLElement[]> =>
  waitFor(async () => {
    const cards = await screen.findAllByRole('article');

    expect(cards.length).toBeGreaterThan(0);

    return cards;
  });

describe('страница списка: данные и состояния', () => {
  beforeEach(() => {
    resetStore();
  });

  it('показывает карточки и общее количество из meta (⑥)', async () => {
    await renderRouteAt('/auctions');

    const cards = await findCards();

    // per_page по умолчанию 20, в сиде аукционов больше.
    expect(cards).toHaveLength(20);
    expect(await screen.findByText(/Найдено: \d+/u)).toBeInTheDocument();
  });

  it('в карточке есть всё, что требует задание', async () => {
    await renderRouteAt('/auctions?per_page=1');

    const cards = await findCards();
    const [card] = cards;

    expect(card).toBeDefined();

    const scope = within(card ?? cards[0]!);

    // Номер заявки, маршрут, груз, цена и primary action.
    expect(scope.getByText(/Заявка A-/u)).toBeInTheDocument();
    expect(scope.getByRole('heading', { level: 2 }).textContent).toMatch(/ → /u);
    expect(scope.getByText('Погрузка')).toBeInTheDocument();
    expect(scope.getByText('Груз')).toBeInTheDocument();
    expect(scope.getByRole('link', { name: /ставк/iu })).toBeInTheDocument();
  });

  it('пустая выдача показывает подсказку про фильтры, а не пустой экран', async () => {
    await renderRouteAt(
      '/auctions?cargo_num=%D0%BD%D0%B5%D1%82-%D1%82%D0%B0%D0%BA%D0%BE%D0%B3%D0%BE',
    );

    expect(await screen.findByText('Аукционы не найдены')).toBeInTheDocument();
    expect(screen.queryAllByRole('article')).toHaveLength(0);
  });

  it('пагинация показывает столько страниц, сколько сказал сервер (⑥)', async () => {
    await renderRouteAt('/auctions?per_page=10');

    await findCards();

    const navigation = await screen.findByRole('navigation');

    // 60+ аукционов по 10 на страницу: страниц заведомо больше одной.
    expect(
      within(navigation).getByRole('button', { name: /Go to page 2|перейти на страницу 2/iu }),
    ).toBeInTheDocument();
  });
});

describe('страница списка: фильтры синхронизируются с URL', () => {
  beforeEach(() => {
    resetStore();
  });

  it('переключатель «Только мои торги» попадает в адрес и сужает выдачу', async () => {
    const user = userEvent.setup();
    const { router } = await renderRouteAt('/auctions');

    const before = (await findCards()).length;

    await user.click(screen.getByRole('switch', { name: 'Только мои торги' }));

    await waitFor(() => {
      expect(router.state.location.search.isBidder).toBe(true);
    });
    // Фильтр не только записался в URL, но и применился к запросу.
    await waitFor(async () => {
      expect((await screen.findAllByRole('article')).length).toBeLessThan(before);
    });
  });

  it('смена фильтра возвращает на первую страницу', async () => {
    const user = userEvent.setup();
    const { router } = await renderRouteAt('/auctions?page=3');

    await findCards();
    await user.click(screen.getByRole('switch', { name: 'Только доступные' }));

    await waitFor(() => {
      // Иначе пользователь остаётся на третьей странице выдачи, в которой
      // после фильтрации одна страница, и видит пустой экран.
      expect(router.state.location.search.page).toBe(1);
      expect(router.state.location.search.isAvailable).toBe(true);
    });
  });

  it('сброс убирает фильтры из адреса, а не пишет пустые значения', async () => {
    const user = userEvent.setup();
    const { router } = await renderRouteAt('/auctions?is_available=true&cargo_num=A-240001');

    await user.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));

    await waitFor(() => {
      expect(router.state.location.search).not.toHaveProperty('isAvailable');
      expect(router.state.location.search).not.toHaveProperty('cargoNum');
    });
  });
});
