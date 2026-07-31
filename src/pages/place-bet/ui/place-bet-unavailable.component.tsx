import { EmptyState, RouterButton } from '@/shared/ui';

export interface PlaceBetUnavailableProps {
  /** `order_uid` аукциона — для ссылки назад на его детальную страницу. */
  auctionUuid: string;
}

/**
 * Экран вместо формы при `permissions.canSetBet === false` (8.1).
 *
 * Показывает объяснение и дорогу назад: кнопка, которая просто не нажимается,
 * читается как поломка интерфейса — тот же принцип, что и у отключённого
 * primary action карточки списка.
 */
export const PlaceBetUnavailable = ({ auctionUuid }: PlaceBetUnavailableProps) => (
  <EmptyState
    title="Ставка недоступна"
    message="По этому аукциону ставки сейчас не принимаются."
    action={
      <RouterButton to="/auctions/$auctionUuid" params={{ auctionUuid }} variant="outlined">
        Назад к аукциону
      </RouterButton>
    }
  />
);
