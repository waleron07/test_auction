import { SnackbarProvider } from 'notistack';

export interface ToastProviderProps {
  /** Дерево приложения. */
  children: React.ReactNode;
}

/** Тосты успеха и ошибки для мутации ставки (PLAN 8.4). */
export const ToastProvider = ({ children }: ToastProviderProps) => (
  <SnackbarProvider
    maxSnack={3}
    autoHideDuration={4000}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
  >
    {children}
  </SnackbarProvider>
);
