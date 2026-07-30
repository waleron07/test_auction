import { create } from 'zustand';

interface FiltersDrawerState {
  /** Открыт ли drawer фильтров на мобильной вёрстке. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Открытость мобильного drawer'а фильтров.
 *
 * Единственное состояние проекта, которому место в Zustand, а не в URL: это
 * состояние интерфейса, а не данных. В ссылке ему делать нечего — открытая
 * панель фильтров не должна воспроизводиться у того, кому эту ссылку прислали.
 */
export const useFiltersDrawerStore = create<FiltersDrawerState>()((set) => ({
  isOpen: false,
  open: () => {
    set({ isOpen: true });
  },
  close: () => {
    set({ isOpen: false });
  },
}));
