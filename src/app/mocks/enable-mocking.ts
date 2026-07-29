/**
 * Поднимает MSW до первого рендера.
 *
 * Импорт worker'а — динамический: так код моков не попадает в продовый бандл.
 * Проект работает без бэкенда, поэтому в dev моки включены всегда.
 */
export const enableMocking = async (): Promise<void> => {
  if (!import.meta.env.DEV) return;

  const { worker } = await import('../../mocks/browser');

  await worker.start({
    onUnhandledRequest: 'bypass',
    quiet: false,
  });
};
