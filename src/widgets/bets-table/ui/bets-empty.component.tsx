import { EmptyState } from '@/shared/ui';

/** Пустое состояние истории ставок — по этому аукциону ставок ещё не было. */
export const BetsEmpty = () => (
  <EmptyState
    title="Ставок пока нет"
    message="Как только перевозчики сделают ставки, они появятся здесь."
  />
);
