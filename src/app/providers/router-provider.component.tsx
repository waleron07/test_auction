import { type QueryClient } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useState } from 'react';

import { createAppRouter } from '../router/router';

export interface AppRouterProviderProps {
  /** Клиент запросов, уезжающий в контекст маршрутов. */
  queryClient: QueryClient;
}

/**
 * Роутер создаётся один раз на монтирование, а не на каждый рендер: иначе
 * StrictMode и любое обновление сверху сбрасывали бы историю навигации.
 */
export const AppRouterProvider = ({ queryClient }: AppRouterProviderProps) => {
  const [router] = useState(() => createAppRouter({ queryClient }));

  return <RouterProvider router={router} />;
};
