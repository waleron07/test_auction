import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';

import { resetStore } from '@/mocks/store';

import { renderRouteAt } from '../helpers/render-route';
import { setViewportWidth } from '../helpers/viewport';

/**
 * Карточки списка помечены ролью article — по ней их и считаем.
 *
 * Обёртка в `waitFor` не нужна: `findAllByRole` сам ждёт и сам падает, если
 * ничего не нашёл, а вложенные ожидания только перемножают таймауты на красном
 * прогоне.
 */
const findCards = (): Promise<HTMLElement[]> => screen.findAllByRole('article');

/** Первая карточка — без ручного сужения типа на каждом использовании. */
const findFirstCard = async (): Promise<HTMLElement> => {
  const [card] = await findCards();

  if (card === undefined) throw new Error('Ни одной карточки не отрисовано.');

  return card;
};

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

    const scope = within(await findFirstCard());

    // Номер заявки, маршрут, груз, цена и primary action.
    expect(scope.getByText(/Заявка A-/u)).toBeInTheDocument();
    expect(scope.getByRole('heading', { level: 2 }).textContent).toMatch(/ → /u);
    expect(scope.getByText('Погрузка')).toBeInTheDocument();
    expect(scope.getByText('Груз')).toBeInTheDocument();
    expect(scope.getByRole('link', { name: /ставк/iu })).toBeInTheDocument();
  });

  it('шаг ставки появляется в карточке после прогрева кэша наведением (㉑)', async () => {
    // Шага нет в DTO списка вовсе: он приходит из detail, который греет
    // prefetch по наведению. До наведения блока шага нет — прочерк на его
    // месте читался бы как «шаг равен нулю».
    const user = userEvent.setup();

    await renderRouteAt('/auctions?per_page=1');

    const card = await findFirstCard();

    expect(within(card).queryByText(/Шаг:/u)).not.toBeInTheDocument();

    await user.hover(card);

    await waitFor(() => {
      expect(within(card).getByText(/Шаг:/u)).toBeInTheDocument();
    });
  });

  it('все карточки имеют одинаковую структуру — вёрстка не зависит от текста', async () => {
    // Карточки стоят рядом в сетке: строка, которая переносится в одной и не
    // переносится в соседней, сдвигает вниз всё, что под ней. Структурная
    // одинаковость — то, что можно проверить в jsdom; высоты проверяются глазами.
    await renderRouteAt('/auctions?per_page=6');

    const cards = await findCards();

    expect(cards.length).toBeGreaterThan(1);

    for (const card of cards) {
      const scope = within(card);

      // Шесть полей груза и маршрута — всегда, независимо от заполненности DTO.
      for (const label of ['Погрузка', 'Выгрузка', 'Груз', 'Вес', 'Объём', 'Кузов']) {
        expect(scope.getByText(label)).toBeInTheDocument();
      }

      // Ровно один заголовок маршрута и одно основное действие: ссылка, если
      // действие доступно, и отключённая кнопка, если торги закрыты.
      expect(scope.getAllByRole('heading', { level: 2 })).toHaveLength(1);
      expect(scope.queryAllByRole('link').length + scope.queryAllByRole('button').length).toBe(1);
    }
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

describe('страница списка: мобильная вёрстка фильтров', () => {
  beforeEach(() => {
    resetStore();
    // Узкое окно: панель фильтров обязана уехать в drawer.
    setViewportWidth(420);
  });

  it('на телефоне вместо панели — кнопка с бейджем активных фильтров', async () => {
    const user = userEvent.setup();

    await renderRouteAt('/auctions?is_available=true&cargo_num=A-240001');
    await findCards();

    // Панели нет: её содержимое недоступно, пока drawer закрыт.
    expect(screen.queryByRole('switch', { name: 'Только доступные' })).not.toBeInTheDocument();

    const filtersButton = screen.getByRole('button', { name: 'Фильтры' });

    // Бейдж показывает число активных фильтров: без него отфильтрованная
    // пустая выдача выглядит как поломка, а не как результат фильтра.
    expect(filtersButton.parentElement?.textContent).toContain('2');

    await user.click(filtersButton);

    // После открытия drawer'а форма доступна целиком.
    expect(await screen.findByRole('switch', { name: 'Только доступные' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Показать результаты' })).toBeInTheDocument();
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
