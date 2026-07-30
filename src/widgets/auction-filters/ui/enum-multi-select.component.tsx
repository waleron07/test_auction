import { Box, Chip, MenuItem, Select } from '@mui/material';

import { type EnumDict } from '@/shared/lib/enums/enum-dict.types';
import { getEnumLabel } from '@/shared/lib/enums/get-enum-label.util';

export interface EnumMultiSelectProps<TValue extends string> {
  /** Подпись: она же плейсхолдер, когда ничего не выбрано. */
  label: string;
  /** Допустимые значения — из той же схемы, что разбирает URL. */
  options: readonly TValue[];
  /** Словарь лейблов и цветов. */
  dict: EnumDict<TValue>;
  /** Выбранные значения. */
  value: TValue[];
  /** Выбор изменился. */
  onChange: (next: TValue[]) => void;
}

/**
 * Мультиселект по значению enum'а.
 *
 * Три фильтра — торговый статус, статус аукциона и тип аукциона — отличаются
 * только словарём, списком значений и подписью. Раньше это были три копии по
 * двадцать семь строк, и они уже начали расходиться: два рисовали выбранное
 * чипами, третий — перечислением через запятую. Одна реализация делает такое
 * расхождение невозможным.
 *
 * Лейблы берутся через `getEnumLabel`, а не индексацией словаря: значение из
 * чужой ссылки может оказаться незнакомым, и деградировать оно обязано до
 * «Неизвестно», а не до пустого чипа.
 */
export const EnumMultiSelect = <TValue extends string>({
  label,
  options,
  dict,
  value,
  onChange,
}: EnumMultiSelectProps<TValue>) => (
  <Select
    multiple
    size="small"
    displayEmpty
    value={value}
    onChange={(event) => {
      onChange(event.target.value as TValue[]);
    }}
    renderValue={(selected) =>
      selected.length === 0 ? (
        label
      ) : (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {selected.map((item) => (
            <Chip key={item} size="small" label={getEnumLabel(dict, item)} />
          ))}
        </Box>
      )
    }
    slotProps={{ input: { 'aria-label': label } }}
  >
    {options.map((option) => (
      <MenuItem key={option} value={option}>
        {getEnumLabel(dict, option)}
      </MenuItem>
    ))}
  </Select>
);
