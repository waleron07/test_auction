import { type QueryClient } from '@tanstack/react-query';
import { createRouter, type RouterHistory } from '@tanstack/react-router';

import { NotFound } from '@/shared/ui/not-found.component';
import { RouteError } from '@/shared/ui/route-error.component';
import { RoutePending } from '@/shared/ui/route-pending.component';

import { routeTree } from './route-tree.gen';
import { type RouterContext } from './router-context';

export type { RouterContext };

export interface CreateAppRouterParams {
  /** Клиент запросов, попадающий в контекст маршрутов. */
  queryClient: QueryClient;
  /**
   * История навигации. В приложении не передаётся — роутер берёт браузерную;
   * тесты передают память, чтобы открыть конкретный URL без jsdom-навигации.
   */
  history?: RouterHistory;
}

/**
 * Собирает роутер приложения.
 *
 * `defaultPreload: 'intent'` вместе с loader'ами детальной страницы закрывает
 * требование задания про prefetch по hover: наведение на `<Link>` карточки
 * вызывает loader, а он греет тот же ключ, который потом читает страница.
 * `defaultPendingMinMs` не даёт скелетону моргать на быстрых ответах моков.
 * @param params Клиент запросов и, для тестов, история навигации.
 * @returns Роутер с общими error/pending/notFound-компонентами.
 */
export const createAppRouter = ({ queryClient, history }: CreateAppRouterParams) =>
  createRouter({
    routeTree,
    ...(history === undefined ? {} : { history }),
    context: { queryClient } satisfies RouterContext,
    defaultPreload: 'intent',
    defaultPreloadDelay: 100,
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: RouteError,
    defaultNotFoundComponent: NotFound,
    defaultPendingComponent: RoutePending,
    defaultPendingMs: 200,
    defaultPendingMinMs: 400,
    scrollRestoration: true,
  });

export type AppRouter = ReturnType<typeof createAppRouter>;

declare module '@tanstack/react-router' {
  interface Register {
    router: AppRouter;
  }
}
