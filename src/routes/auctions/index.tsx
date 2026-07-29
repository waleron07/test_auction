import { createFileRoute } from '@tanstack/react-router';

import { EmptyState } from '@/shared/ui';

/**
 * `/auctions` — список аукционов. Пока заглушка: `validateSearch`, loader и
 * страница из слоя pages появляются в фазах 2–4 (PLAN). Маршрут заведён уже
 * сейчас, потому что на него ссылаются NotFound и RouteError.
 */
export const Route = createFileRoute('/auctions/')({
  component: () => (
    <EmptyState
      title="Аукционы"
      message="Каркас приложения поднят. Список, фильтры и ставки подключаются в следующих фазах."
    />
  ),
});
