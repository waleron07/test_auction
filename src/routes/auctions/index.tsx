import { createFileRoute, type SearchSchemaInput } from '@tanstack/react-router';

import { parseAuctionSearch } from '@/features/filter-auctions/lib/parse-auction-search.util';
import { ApiErrorState, EmptyState } from '@/shared/ui';

/**
 * `/auctions` — список аукционов.
 *
 * `validateSearch` — тонкая обёртка над чистой функцией разбора: вся логика
 * «что делать с мусором в URL» живёт в `parseAuctionSearch` и тестируется без
 * монтирования приложения. Схема ничего не бросает, поэтому ссылка вида
 * `?page=abc&status=МУСОР` открывает список с дефолтами, а не экран ошибки —
 * прямое требование задания.
 *
 * Loader'а здесь нет намеренно (0.66): он блокировал бы навигацию при каждой
 * смене фильтра. Данные списка грузит сама страница, показывая skeleton.
 */
export const Route = createFileRoute('/auctions/')({
  // `SearchSchemaInput` помечает вход как «всё необязательно»: без него роутер
  // считает фильтры обязательными и требует передавать их в каждой ссылке на
  // список — включая «К списку аукционов» из экранов ошибок.
  validateSearch: (input: Record<string, unknown> & SearchSchemaInput) => parseAuctionSearch(input),
  errorComponent: ({ error, reset }) => <ApiErrorState error={error} onRetry={reset} />,
  component: () => (
    <EmptyState
      title="Аукционы"
      message="Фильтры разбираются из URL. Список, карточки и пагинация — фаза 5."
    />
  ),
});
