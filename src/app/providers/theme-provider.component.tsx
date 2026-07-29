import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';

import { theme } from '../theme/theme';

export interface ThemeProviderProps {
  /** Дерево приложения. */
  children: React.ReactNode;
}

/** Тема MUI + CssBaseline (сброс стилей). */
export const ThemeProvider = ({ children }: ThemeProviderProps) => (
  <MuiThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </MuiThemeProvider>
);
