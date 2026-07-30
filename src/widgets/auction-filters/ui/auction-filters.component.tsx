import FilterListIcon from '@mui/icons-material/FilterList';
import { Badge, Box, Button, Drawer, Paper, Typography } from '@mui/material';

import { countActiveFilters } from '@/features/filter-auctions/lib/count-active-filters.util';
import { type AuctionSearch } from '@/features/filter-auctions/model/auction-search.schema';
import { useIsMobile } from '@/shared/config/breakpoints';

import { useFiltersDrawerStore } from '../model/filters-drawer.store';

import { AuctionFiltersForm } from './auction-filters-form.component';

export interface AuctionFiltersProps {
  /** Текущее состояние фильтров из URL. */
  search: AuctionSearch;
  /** Применение изменений. */
  onChange: (patch: Partial<AuctionSearch>) => void;
}

/**
 * Фильтры списка: панель на десктопе, drawer на телефоне.
 *
 * На узких ширинах панель занимала бы весь первый экран, поэтому она уезжает в
 * drawer, а на её месте остаётся кнопка с бейджем количества активных фильтров
 * (5.2). Бейдж обязателен: без него отфильтрованная пустая выдача выглядит как
 * поломка, а не как результат собственного фильтра.
 */
export const AuctionFilters = ({ search, onChange }: AuctionFiltersProps) => {
  // Условие ширины берётся из общей карты, а не пишется здесь: та же граница
  // управляет колонкой сайдбара на странице списка, и два независимых
  // медиазапроса разъехались бы на 900px — ни панели, ни кнопки.
  const isMobile = useIsMobile();
  const isOpen = useFiltersDrawerStore((state) => state.isOpen);
  const open = useFiltersDrawerStore((state) => state.open);
  const close = useFiltersDrawerStore((state) => state.close);

  if (!isMobile) {
    return (
      <Paper component="aside" variant="outlined" sx={{ p: 2, position: 'sticky', top: 16 }}>
        <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
          Фильтры
        </Typography>
        <AuctionFiltersForm search={search} onChange={onChange} />
      </Paper>
    );
  }

  const activeCount = countActiveFilters(search);

  return (
    <Box>
      <Badge badgeContent={activeCount} color="primary">
        <Button variant="outlined" startIcon={<FilterListIcon />} onClick={open}>
          Фильтры
        </Button>
      </Badge>

      <Drawer anchor="bottom" open={isOpen} onClose={close}>
        <Box sx={{ p: 2, maxHeight: '85vh', overflowY: 'auto' }}>
          <Typography variant="h3" component="h2" sx={{ mb: 2 }}>
            Фильтры
          </Typography>
          <AuctionFiltersForm search={search} onChange={onChange} />
          <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={close}>
            Показать результаты
          </Button>
        </Box>
      </Drawer>
    </Box>
  );
};
