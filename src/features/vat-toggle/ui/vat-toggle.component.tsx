import { ToggleButton, ToggleButtonGroup } from '@mui/material';

import { useVatModeStore, type VatMode } from '@/shared/model/vat-mode.store';

/**
 * Переключатель режима «с НДС / без НДС».
 *
 * Только разметка: состояние живёт в `shared/model/vat-mode.store.ts`, а не
 * здесь, — стор читают компоненты `entities` (карточка списка, цены на
 * детальной), и слою ниже нельзя импортировать слой выше. Компонент лишь
 * подписывается на тот же стор и пишет в него (ARCHITECTURE 4.1).
 */
export const VatToggle = () => {
  const mode = useVatModeStore((state) => state.mode);
  const setMode = useVatModeStore((state) => state.setMode);

  return (
    <ToggleButtonGroup
      size="small"
      exclusive
      value={mode}
      onChange={(_, next: VatMode | null) => {
        if (next !== null) setMode(next);
      }}
      aria-label="Режим отображения цены"
    >
      <ToggleButton value="with">С НДС</ToggleButton>
      <ToggleButton value="without">Без НДС</ToggleButton>
    </ToggleButtonGroup>
  );
};
