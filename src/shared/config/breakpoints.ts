import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Единственное место, где заданы условия ширины и высоты.
 * Компоненты не пишут медиазапросы строками — иначе карта ширин из PLAN 0.7
 * расползётся по проекту и перестанет быть проверяемой.
 *
 * `useMediaQuery` применяется только там, где меняется **структура**
 * (таблица ↔ карточки, Dialog ↔ страница), а не оформление: оформление —
 * через `sx` с объектами по брейкпоинтам, без лишнего ререндера.
 */

/** xs–sm: телефон и телефон landscape. Ниже 320px поддержка не заявлена. */
export const useIsMobile = (): boolean => {
  const theme = useTheme();

  return useMediaQuery(theme.breakpoints.down('md'));
};

/** md: планшет и узкое окно ноутбука. */
export const useIsTablet = (): boolean => {
  const theme = useTheme();

  return useMediaQuery(theme.breakpoints.between('md', 'lg'));
};

/**
 * Телефон в landscape: высота 320–500px при большой ширине.
 * Диалог формы ставки переключается в full-screen по высоте, а не только
 * по ширине — иначе модалка не помещается и обрезается (PLAN 0.7, правило 5).
 */
export const useIsShortViewport = (): boolean => useMediaQuery('(max-height: 500px)');
