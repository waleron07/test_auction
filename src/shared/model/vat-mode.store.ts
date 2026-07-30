import { create } from 'zustand';

/** Режим отображения цен: с НДС или без. */
export type VatMode = 'with' | 'without';

interface VatModeState {
  /** Текущий режим. По умолчанию «с НДС» — это база всех значений схемы (⑧). */
  mode: VatMode;
  /** Устанавливает режим явно. */
  setMode: (mode: VatMode) => void;
  /** Переключает режим — обработчик тумблера. */
  toggle: () => void;
}

/**
 * Сквозной режим НДС.
 *
 * Живёт в `shared/model`, а не в `features/vat-toggle`, потому что его читают
 * компоненты слоя `entities` (карточка, цена ставки), а слой ниже не имеет
 * права импортировать слой выше — стык явно разрешён в ARCHITECTURE 4.1.
 *
 * В URL не синхронизируется: это режим просмотра, а не фильтр, и в
 * воспроизводимой ссылке на список ему делать нечего (в отличие от фильтров —
 * решение 0.3).
 */
export const useVatModeStore = create<VatModeState>()((set) => ({
  mode: 'with',
  setMode: (mode) => {
    set({ mode });
  },
  toggle: () => {
    set((state) => ({ mode: state.mode === 'with' ? 'without' : 'with' }));
  },
}));
