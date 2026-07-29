import { createTheme, type Theme } from '@mui/material/styles';

/**
 * Тема проекта. Брейкпоинты — дефолтные MUI, свои не заводим:
 * меньше расхождений с компонентами библиотеки (PLAN 0.7).
 */
export const theme: Theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1b5e9c' },
    secondary: { main: '#5b6b7c' },
    success: { main: '#2e7d32' },
    warning: { main: '#ed6c02' },
    error: { main: '#c62828' },
    background: { default: '#f4f6f8', paper: '#ffffff' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      'Segoe UI',
      'Roboto',
      'Helvetica Neue',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontSize: '1.75rem', fontWeight: 600 },
    h2: { fontSize: '1.375rem', fontWeight: 600 },
    h3: { fontSize: '1.125rem', fontWeight: 600 },
    // Цифры не переносятся и не «прыгают» по ширине: цена, шаг, вес
    // рендерятся моноширинными цифрами (PLAN 0.7, правило 2).
    body2: { fontVariantNumeric: 'tabular-nums' },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        // Горизонтальный скролл страницы запрещён на всех ширинах.
        body: { overflowX: 'hidden' },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        // Тач-цели ≥ 44px на телефонах (PLAN 0.7, правило 3).
        root: ({ theme: t }) => ({
          textTransform: 'none',
          [t.breakpoints.down('md')]: { minHeight: 44 },
        }),
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: ({ theme: t }) => ({
          [t.breakpoints.down('md')]: { minWidth: 44, minHeight: 44 },
        }),
      },
    },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiCard: { defaultProps: { variant: 'outlined' } },
    MuiPaper: { defaultProps: { elevation: 0 } },
  },
});
