import { createRootRouteWithContext } from '@tanstack/react-router';

import { RootLayout } from '@/app/layout/root-layout.component';
import { type RouterContext } from '@/app/router/router-context';

/**
 * Корневой маршрут. Держит только общую рамку страницы, чтобы каждый маршрут
 * не собирал layout заново.
 *
 * `createRootRouteWithContext` фиксирует тип контекста: без него `queryClient`
 * в loader'ах был бы `any`, и вся типизация запросов рассыпалась бы на границе
 * маршрута (ARCHITECTURE 5.1).
 *
 * Сама рамка — в `RootLayout`: компоненты живут в `*.component.tsx`, а файл
 * маршрута остаётся конфигурацией (требование задания о суффиксе).
 */
export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});
