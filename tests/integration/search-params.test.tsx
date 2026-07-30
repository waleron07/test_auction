import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { buildAuctionListRequest } from '@/features/filter-auctions/lib/build-auction-list-request.util';
import { parseAuctionSearch } from '@/features/filter-auctions/lib/parse-auction-search.util';
import {
  DEFAULT_PER_PAGE,
  MAX_PER_PAGE,
} from '@/features/filter-auctions/model/auction-search.schema';
import { resetStore } from '@/mocks/store';

import { renderRouteAt } from '../helpers/render-route';

/**
 * Критерий готовности фазы 4: URL с мусорными параметрами открывается с
 * дефолтными фильтрами и без падения.
 *
 * Здесь проверяется связка «URL → validateSearch → состояние маршрута» на
 * настоящем роутере. Сам разбор покрыт юнит-тестами, поэтому тут по одному
 * представителю на ветку схемы, а не полный перебор.
 */
describe('search params: мусор в URL не роняет приложение', () => {
  beforeEach(() => {
    resetStore();
  });

  it('нечисловая страница подменяется первой, и маршрут всё равно открывается', async () => {
    const { router } = await renderRouteAt('/auctions?page=abc');

    expect(await screen.findByRole('heading', { name: 'Аукционы' })).toBeInTheDocument();
    // Проверяется совпавший маршрут, а не pathname: адрес в location — это
    // то, что запросили, и он совпадёт даже если ни один маршрут не подошёл.
    expect(router.state.matches.at(-1)?.routeId).toBe('/auctions/');
    expect(router.state.location.search.page).toBe(1);
  });

  it('нулевая и отрицательная страница подменяются первой', async () => {
    const { router: zero } = await renderRouteAt('/auctions?page=0');

    expect(zero.state.location.search.page).toBe(1);

    const { router: negative } = await renderRouteAt('/auctions?page=-100');

    expect(negative.state.location.search.page).toBe(1);
  });

  it('слишком большой per_page клампится до предела, а не даёт 422', async () => {
    const { router } = await renderRouteAt('/auctions?per_page=99999');

    expect(router.state.location.search.perPage).toBe(MAX_PER_PAGE);
  });

  it('незнакомое значение фильтра-enum отбрасывается', async () => {
    const { router } = await renderRouteAt(
      '/auctions?status=%D0%9C%D0%A3%D0%A1%D0%9E%D0%A0&auc_type=Down',
    );

    expect(router.state.location.search.status).toEqual([]);
    // Соседний корректный фильтр при этом остаётся.
    expect(router.state.location.search.aucType).toEqual(['Down']);
  });

  it('незнакомые параметры URL не ломают разбор и не доезжают до запроса', async () => {
    // В ссылку могли дописать utm-метки. TanStack Router сохраняет незнакомые
    // параметры и в адресе, и в состоянии маршрута — чужие параметры не должны
    // теряться при навигации. Гарантия проекта другая и проверяется здесь:
    // такие параметры не попадают в тело запроса, потому что request builder
    // читает только разобранные поля.
    const { router } = await renderRouteAt('/auctions?utm_source=mail&foo=bar&page=2');

    expect(await screen.findByRole('heading', { name: 'Аукционы' })).toBeInTheDocument();
    expect(router.state.location.search.page).toBe(2);

    const request = buildAuctionListRequest(parseAuctionSearch(router.state.location.search));

    expect(Object.keys(request).sort()).toEqual(['page', 'per_page']);
  });

  it('пустой URL даёт дефолтные фильтры', async () => {
    const { router } = await renderRouteAt('/auctions');

    expect(router.state.location.search.page).toBe(1);
    expect(router.state.location.search.perPage).toBe(DEFAULT_PER_PAGE);
    expect(router.state.location.search.status).toEqual([]);
  });

  it('корректные фильтры доживают до состояния маршрута', async () => {
    const { router } = await renderRouteAt('/auctions?auc_type=Down&price_from=30000&sort=oldest');

    expect(await screen.findByRole('heading', { name: 'Аукционы' })).toBeInTheDocument();

    const search = router.state.location.search;

    expect(search.aucType).toEqual(['Down']);
    expect(search.priceFrom).toBe(30_000);
    expect(search.sort).toBe('oldest');
  });

  it('camelCase в адресной строке тоже разбирается', async () => {
    // Роутер записывает состояние обратно в URL именно в этой форме, поэтому
    // ссылка, скопированная из адресной строки после навигации, обязана открыться.
    const { router } = await renderRouteAt('/auctions?cargoNum=A-240001&perPage=50');

    expect(router.state.location.search.cargoNum).toBe('A-240001');
    expect(router.state.location.search.perPage).toBe(50);
  });
});
