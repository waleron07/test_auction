import { type QueryClient } from '@tanstack/react-query';

/**
 * Контекст маршрутов. Вынесен отдельным файлом, а не оставлен в `router.ts`:
 * корневой маршрут (`src/routes/__root.tsx`) типизируется этим интерфейсом,
 * а `router.ts` импортирует сгенерированное дерево, которое импортирует
 * корневой маршрут. Общий тип в третьем файле разрывает цикл
 * (import-x/no-cycle).
 */
export interface RouterContext {
  /** Клиент запросов: маршруты греют кэш через loader, а не импортируют синглтон. */
  queryClient: QueryClient;
}
