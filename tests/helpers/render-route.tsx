import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { createAppRouter, type AppRouter } from '@/app/router/router';

export interface RenderedRoute {
  /** Роутер: из него читаются совпавший маршрут и разобранное состояние. */
  router: AppRouter;
  /**
   * Клиент запросов. Нужен, чтобы проверить **результат** работы loader'а:
   * `ensureQueryData` греет кэш, и наличие данных в нём — единственное прямое
   * доказательство, что loader отработал, а не просто отрендерился заголовок.
   */
  queryClient: QueryClient;
}

/**
 * Поднимает **настоящий** роутер на заданном URL с памятью вместо браузерной
 * истории.
 *
 * `await router.load()` до рендера — не формальность: без него проверка
 * состояния роутера сразу после `findBy*` становится гонкой. Появление элемента
 * на экране говорит, что что-то отрендерилось, но не что навигация и loader'ы
 * завершились, и `router.state.location.search` может быть прочитан на
 * промежуточном состоянии.
 *
 * Retry отключён намеренно: тесты проверяют реакцию на первую же ошибку, а
 * повторы TanStack Query превратили бы падение в таймаут.
 * @param path Адрес, на котором открывается приложение.
 * @returns Роутер и клиент запросов.
 */
export const renderRouteAt = async (path: string): Promise<RenderedRoute> => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createAppRouter({
    queryClient,
    history: createMemoryHistory({ initialEntries: [path] }),
  });

  await router.load();

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );

  return { router, queryClient };
};
