import { LocalizationProvider as MuiLocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ru } from 'date-fns/locale';

export interface LocalizationProviderProps {
  /** Дерево приложения. */
  children: React.ReactNode;
}

/**
 * Адаптер дат для пикеров. Фильтры дат — date-time со смещением,
 * а не date: схема валидирует их строгим `pattern` (ловушка ⑮).
 */
export const LocalizationProvider = ({ children }: LocalizationProviderProps) => (
  <MuiLocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={ru}>
    {children}
  </MuiLocalizationProvider>
);
