import { useSnackbar } from 'notistack';
import { useMemo } from 'react';

export interface Toast {
  success: (message: string) => void;
  error: (message: string) => void;
}

/**
 * Обёртка над `notistack` (0.66, 8.4): два варианта, а не произвольные опции
 * `enqueueSnackbar` по месту вызова — тост ставки и любой будущий тост
 * выглядят одинаково, а не как N решений об оформлении в N компонентах.
 * @returns `success`/`error` — вызвать тост нужного вида.
 */
export const useToast = (): Toast => {
  const { enqueueSnackbar } = useSnackbar();

  return useMemo(
    () => ({
      success: (message: string) => {
        enqueueSnackbar(message, { variant: 'success' });
      },
      error: (message: string) => {
        enqueueSnackbar(message, { variant: 'error' });
      },
    }),
    [enqueueSnackbar],
  );
};
