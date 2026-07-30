import { EmptyState } from '@/shared/ui';

/**
 * Замена таблицы при `permissions.hideBetsHistory` (⑪).
 *
 * Само решение «скрыто, если `true` хотя бы в одном из двух источников» (⑩)
 * принимает `mapAuctionPermissions` — этот компонент только рендерит
 * готовый флаг, логики слияния источников здесь нет.
 */
export const BetsHidden = () => (
  <EmptyState
    title="История ставок скрыта"
    message="Организатор скрыл историю ставок по этому аукциону."
  />
);
