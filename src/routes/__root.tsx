import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { type RouterContext } from '@/app/router/router-context';
import { PageLayout } from '@/shared/ui';

/**
 * Корневой маршрут. Держит только общую рамку страницы: шапка и остальная
 * хромота слоя widgets подключаются здесь же в следующих фазах, чтобы каждый
 * маршрут не собирал layout заново.
 *
 * `createRootRouteWithContext` фиксирует тип контекста: без него `queryClient`
 * в loader'ах был бы `any`, и вся типизация запросов рассыпалась бы на границе
 * маршрута (ARCHITECTURE 5.1).
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <PageLayout>
      <Outlet />
    </PageLayout>
  ),
});
