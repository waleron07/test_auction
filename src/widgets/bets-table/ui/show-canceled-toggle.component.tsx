import { FormControlLabel, Switch } from '@mui/material';

export interface ShowCanceledToggleProps {
  /** Текущее значение — оно же параметр `all` запроса `GET /bets` (㉙). */
  checked: boolean;
  onChange: (checked: boolean) => void;
}

/**
 * Переключатель параметра `all` у `GET /bets`.
 *
 * Без `all: true` отменённые ставки не приходят вовсе — выключенный тумблер
 * переводит запрос в `all: false`, и такие ставки пропадают из ответа сервера,
 * а не просто скрываются на клиенте (㉙).
 */
export const ShowCanceledToggle = ({ checked, onChange }: ShowCanceledToggleProps) => (
  <FormControlLabel
    control={
      <Switch
        checked={checked}
        onChange={(event) => {
          onChange(event.target.checked);
        }}
      />
    }
    label="Показывать отменённые"
  />
);
