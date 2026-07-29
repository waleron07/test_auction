import { QueryClient } from '@tanstack/react-query';

/**
 * Создаёт QueryClient с настройками проекта.
 *
 * Фабрика, а не синглтон-константа: тесты поднимают свой клиент на каждый
 * тест, иначе кэш протекает между ними. В приложении вызывается один раз
 * и передаётся в контекст роутера (ARCHITECTURE 5.1).
 */
export const createQueryClient = (): QueryClient =>
  new QueryClient({
    defaultOptions: {
      queries: {
        // Прогретый prefetch'ем кэш не должен немедленно считаться протухшим,
        // иначе hover-prefetch теряет смысл.
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => {
          // Повторять имеет смысл только сетевые сбои и 503.
          // 401 и 404 повторять бессмысленно — ответ не изменится.
          const status = (error as { status?: number }).status;

          if (status === 401 || status === 404 || status === 422) return false;

          return failureCount < 2;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });
