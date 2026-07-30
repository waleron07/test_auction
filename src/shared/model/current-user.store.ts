import { create } from 'zustand';

interface CurrentUserState {
  /** `subscriber_id`, по которому определяется «своя ставка» в истории (⑬). */
  subscriberId: number;
  /** `organization_id` той же личности. */
  organizationId: number;
}

/**
 * «Моя личность» — перевозчик, от чьего лица работает приложение.
 *
 * Схема не содержит эндпоинта профиля, поэтому личность фиксирована. Живёт в
 * `shared/model`, а не только в моках, как единственный источник правды:
 * значения читают и `entities/bet` (подсветка своей ставки в истории, ⑬), и
 * `CURRENT_USER` в `src/mocks/store.ts` — мок берёт `subscriberId`/
 * `organizationId` отсюда через `useCurrentUserStore.getState()`, а не хранит
 * вторую копию чисел. Мокам это разрешено: `src/mocks` не ограничен
 * правилами направления импорта FSD так, как `entities`.
 */
export const useCurrentUserStore = create<CurrentUserState>()(() => ({
  subscriberId: 900_100,
  organizationId: 700_100,
}));
