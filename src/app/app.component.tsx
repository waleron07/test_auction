import { useState } from 'react';

import { LocalizationProvider } from './providers/localization-provider.component';
import { QueryProvider } from './providers/query-provider.component';
import { AppRouterProvider } from './providers/router-provider.component';
import { ThemeProvider } from './providers/theme-provider.component';
import { ToastProvider } from './providers/toast-provider.component';
import { createQueryClient } from './query/query-client';

/**
 * Корневой компонент: только сборка провайдеров, никакой логики.
 *
 * Порядок важен. Тема — снаружи всех, иначе тосты и пикеры рендерятся до
 * применения палитры. QueryProvider — выше роутера: loader'ы маршрутов
 * обращаются к кэшу запросов через контекст.
 */
export const App = () => {
  const [queryClient] = useState(createQueryClient);

  return (
    <ThemeProvider>
      <LocalizationProvider>
        <QueryProvider client={queryClient}>
          <ToastProvider>
            <AppRouterProvider queryClient={queryClient} />
          </ToastProvider>
        </QueryProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
};
