import { createFileRoute, redirect } from '@tanstack/react-router';

/**
 * Корень сайта — не экран, а редирект: единственная точка входа в приложение
 * это список аукционов. Редирект в `beforeLoad`, а не рендер-редирект, чтобы
 * пустой layout не мигал между переходами.
 */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({ to: '/auctions', replace: true });
  },
});
