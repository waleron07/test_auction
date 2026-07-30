import { Box, Pagination, Stack, Typography } from '@mui/material';

import { type AuctionSearch } from '@/features/filter-auctions/model/auction-search.schema';
import { useFiltersSync } from '@/features/filter-auctions/model/use-filters-sync.hook';
import { ApiErrorState, EmptyState } from '@/shared/ui';
import { AuctionCardListSkeleton } from '@/widgets/auction-card-list/ui/auction-card-list-skeleton.component';
import { AuctionCardList } from '@/widgets/auction-card-list/ui/auction-card-list.component';
import { AuctionFilters } from '@/widgets/auction-filters/ui/auction-filters.component';

import { useAuctionsList } from '../model/use-auctions-list.hook';

export interface AuctionsListPageProps {
  /** Разобранные фильтры из URL. */
  search: AuctionSearch;
}

/**
 * Страница списка аукционов.
 *
 * Три состояния разведены явно (5.4): скелетон — только на первой загрузке
 * (при смене страницы данные остаются на месте благодаря `keepPreviousData`),
 * ошибка — с разбором кода контракта и возможностью повторить, пустая выдача —
 * с подсказкой сбросить фильтры, потому что чаще всего пусто именно из-за них.
 */
export const AuctionsListPage = ({ search }: AuctionsListPageProps) => {
  const syncFilters = useFiltersSync();
  const { data, isPending, isError, error, refetch, isPlaceholderData } = useAuctionsList(search);

  const items = data?.data ?? [];
  const lastPage = data?.meta?.last_page ?? 1;
  const total = data?.meta?.total ?? 0;

  return (
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        alignItems: 'start',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(260px, 320px) minmax(0, 1fr)' },
      }}
    >
      <AuctionFilters search={search} onChange={syncFilters} />

      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <Typography variant="h1" component="h1">
            Аукционы
          </Typography>
          {isPending ? null : (
            <Typography variant="body2" color="text.secondary">
              Найдено: {total}
            </Typography>
          )}
        </Box>

        {/*
          Состояния взаимоисключающие, поэтому это одна цепочка, а не четыре
          соседних блока с тройным отрицанием в последнем условии. Порядок —
          решение: ошибка важнее устаревших данных, поэтому при сбое
          показывается она, а не прежняя выдача под баннером.
        */}
        {isPending ? (
          <AuctionCardListSkeleton />
        ) : isError ? (
          <ApiErrorState
            error={error}
            onRetry={() => {
              void refetch();
            }}
          />
        ) : items.length === 0 ? (
          <EmptyState
            title="Аукционы не найдены"
            message="По выбранным фильтрам ничего нет. Попробуйте смягчить условия или сбросить фильтры."
          />
        ) : (
          // Полупрозрачность вместо скелетона: данные предыдущей страницы
          // остаются читаемыми, но видно, что идёт обновление.
          <Box sx={{ opacity: isPlaceholderData ? 0.6 : 1, transition: 'opacity 150ms' }}>
            <AuctionCardList items={items} />
          </Box>
        )}

        {lastPage > 1 ? (
          <Stack sx={{ pt: 1, alignItems: 'center' }}>
            <Pagination
              // Число страниц берётся из meta.last_page, а не вычисляется (⑥).
              count={lastPage}
              page={search.page}
              onChange={(_, page) => {
                syncFilters({ page });
              }}
              siblingCount={0}
              color="primary"
            />
          </Stack>
        ) : null}
      </Stack>
    </Box>
  );
};
