import { QueryClient } from '@tanstack/react-query';
import { createMemoryHistory, RouterProvider } from '@tanstack/react-router';
import { render } from '@testing-library/react';

import { LocalizationProvider } from '@/app/providers/localization-provider.component';
import { QueryProvider } from '@/app/providers/query-provider.component';
import { ThemeProvider } from '@/app/providers/theme-provider.component';
import { ToastProvider } from '@/app/providers/toast-provider.component';
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
 * Провайдеры — те же и в том же порядке, что в `app.component`: тема, локаль
 * пикеров, запросы, тосты. Иначе тест проверяет не то приложение, что уезжает
 * в браузер: без `LocalizationProvider` падают пикеры дат в фильтрах, без темы
 * — брейкпоинты, и падение выглядит как «элемент не найден».
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
    <ThemeProvider>
      <LocalizationProvider>
        <QueryProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryProvider>
      </LocalizationProvider>
    </ThemeProvider>,
  );

  return { router, queryClient };
};
