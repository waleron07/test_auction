import { Autocomplete, Box, Button, FormControlLabel, Switch, TextField } from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { useRef, useState } from 'react';

import {
  AUCTION_STATUSES,
  AUCTION_TYPES,
  type AuctionSearch,
  EMPTY_FILTERS,
  TRADING_STATUSES,
} from '@/features/filter-auctions/model/auction-search.schema';
import { CITIES } from '@/shared/config/cities';
import { parseApiDateTime } from '@/shared/lib/date/parse-api-date-time.util';
import { toApiDateTime } from '@/shared/lib/date/to-api-date-time.util';
import { AUCTION_STATUS_DICT } from '@/shared/lib/enums/auction-status.dict';
import { AUCTION_TYPE_DICT } from '@/shared/lib/enums/auction-type.dict';
import { TRADING_STATUS_DICT } from '@/shared/lib/enums/trading-status.dict';

import { EnumMultiSelect } from './enum-multi-select.component';

/** Задержка перед записью текста в URL: адрес не должен меняться на каждую букву. */
const TEXT_DEBOUNCE_MS = 400;

/**
 * Списки значений берутся из той же схемы, что разбирает URL.
 *
 * Иначе получаются два независимых источника: фильтр, который можно выставить
 * ссылкой, но нельзя выбрать в интерфейсе, — или наоборот, значение в
 * выпадающем списке, которое разбор молча выбросит.
 */
const CITY_NAMES = CITIES.map((city) => city.name);

export interface AuctionFiltersFormProps {
  /** Текущее состояние фильтров из URL. */
  search: AuctionSearch;
  /** Применение изменений: пишет в адресную строку. */
  onChange: (patch: Partial<AuctionSearch>) => void;
}

/**
 * Тело формы фильтров — общее для панели десктопа и для мобильного drawer'а.
 *
 * Все одиннадцать обязательных фильтров задания собраны здесь. Подписи двух
 * статусов сформулированы однозначно (①): «Мой статус в торгах» — это `status`
 * (строки), «Статус аукциона» — `statuses` (числовые коды). Перепутать их —
 * самая дорогая ошибка контракта, и защита от неё начинается с подписи.
 *
 * Текстовые поля пишут в URL с задержкой: адрес, меняющийся на каждую букву,
 * забивает историю браузера и делает кнопку «назад» бесполезной.
 */
export const AuctionFiltersForm = ({ search, onChange }: AuctionFiltersFormProps) => {
  /**
   * Токен сброса. Текстовые поля неуправляемые: значение из URL задаётся
   * `defaultValue`, а внешний сброс выражается сменой `key`, из-за которой поля
   * пересоздаются с новым значением. Синхронизация состоянием потребовала бы
   * записи в стейт из эффекта — каскадных ререндеров на каждую букву.
   */
  const [resetToken, setResetToken] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const priceRef = useRef({ from: search.priceFrom, to: search.priceTo });

  const commitCargoNum = (value: string): void => {
    clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      const trimmed = value.trim();

      onChange({ cargoNum: trimmed === '' ? undefined : trimmed });
    }, TEXT_DEBOUNCE_MS);
  };

  const parsePrice = (value: string): number | undefined => {
    const parsed = Number(value.trim());

    return value.trim() === '' || !Number.isFinite(parsed) || parsed < 0 ? undefined : parsed;
  };

  const applyPrice = (): void => {
    onChange({ priceFrom: priceRef.current.from, priceTo: priceRef.current.to });
  };

  return (
    <Box sx={{ display: 'grid', gap: 2 }}>
      <TextField
        key={`cargo-num-${String(resetToken)}`}
        label="Номер заявки"
        size="small"
        defaultValue={search.cargoNum ?? ''}
        onChange={(event) => {
          commitCargoNum(event.target.value);
        }}
        slotProps={{ htmlInput: { 'aria-label': 'Номер заявки' } }}
      />

      <EnumMultiSelect
        label="Мой статус в торгах"
        options={TRADING_STATUSES}
        dict={TRADING_STATUS_DICT}
        value={search.status}
        onChange={(status) => {
          onChange({ status });
        }}
      />

      <EnumMultiSelect
        label="Статус аукциона"
        options={AUCTION_STATUSES}
        dict={AUCTION_STATUS_DICT}
        value={search.statuses}
        onChange={(statuses) => {
          onChange({ statuses });
        }}
      />

      <EnumMultiSelect
        label="Тип аукциона"
        options={AUCTION_TYPES}
        dict={AUCTION_TYPE_DICT}
        value={search.aucType}
        onChange={(aucType) => {
          onChange({ aucType });
        }}
      />

      <Autocomplete
        size="small"
        options={CITY_NAMES}
        value={search.loadCity ?? null}
        onChange={(_, value) => {
          onChange({ loadCity: value ?? undefined });
        }}
        renderInput={(params) => <TextField {...params} label="Город погрузки" />}
      />

      <Autocomplete
        size="small"
        options={CITY_NAMES}
        value={search.unloadCity ?? null}
        onChange={(_, value) => {
          onChange({ unloadCity: value ?? undefined });
        }}
        renderInput={(params) => <TextField {...params} label="Город выгрузки" />}
      />

      <DateTimePicker
        label="Погрузка от"
        value={parseApiDateTime(search.loadDateFrom)}
        onChange={(value) => {
          onChange({
            loadDateFrom: value === null ? undefined : (toApiDateTime(value) ?? undefined),
          });
        }}
        slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
      />

      <DateTimePicker
        label="Погрузка до"
        value={parseApiDateTime(search.loadDateTo)}
        onChange={(value) => {
          onChange({
            loadDateTo: value === null ? undefined : (toApiDateTime(value) ?? undefined),
          });
        }}
        slotProps={{ textField: { size: 'small' }, field: { clearable: true } }}
      />

      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          key={`price-from-${String(resetToken)}`}
          label="Цена от"
          size="small"
          type="number"
          defaultValue={search.priceFrom ?? ''}
          onChange={(event) => {
            priceRef.current.from = parsePrice(event.target.value);
          }}
          onBlur={applyPrice}
        />
        <TextField
          key={`price-to-${String(resetToken)}`}
          label="Цена до"
          size="small"
          type="number"
          defaultValue={search.priceTo ?? ''}
          onChange={(event) => {
            priceRef.current.to = parsePrice(event.target.value);
          }}
          onBlur={applyPrice}
        />
      </Box>

      <FormControlLabel
        control={
          <Switch
            checked={search.isAvailable === true}
            onChange={(event) => {
              onChange({ isAvailable: event.target.checked ? true : undefined });
            }}
          />
        }
        label="Только доступные"
      />

      <FormControlLabel
        control={
          <Switch
            checked={search.isBidder === true}
            onChange={(event) => {
              onChange({ isBidder: event.target.checked ? true : undefined });
            }}
          />
        }
        label="Только мои торги"
      />

      <Button
        variant="outlined"
        onClick={() => {
          // Сброс — это удаление фильтров, а не запись пустых значений:
          // иначе адрес зарастает `cargo_num=&status=`.
          clearTimeout(debounceRef.current);
          priceRef.current = { from: undefined, to: undefined };
          setResetToken((token) => token + 1);
          onChange(EMPTY_FILTERS);
        }}
      >
        Сбросить фильтры
      </Button>
    </Box>
  );
};
