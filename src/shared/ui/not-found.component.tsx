import { Button } from '@mui/material';
import { Link } from '@tanstack/react-router';

import { ErrorState } from './error-state.component';

export interface NotFoundProps {
  /** Пояснение: что именно не найдено. */
  message?: string;
  /**
   * Полезная нагрузка из `notFound({ data })`. Роутер передаёт её сам, когда
   * компонент подставлен как `notFoundComponent`; строка используется как текст.
   */
  data?: unknown;
}

/**
 * `notFoundComponent` роутера. 404 в этом контракте — ожидаемое состояние
 * (у трёх из четырёх операций объявлен ответ 404), а не сбой приложения.
 */
export const NotFound = ({ message, data }: NotFoundProps) => (
  <ErrorState
    title="Не найдено"
    message={message ?? (typeof data === 'string' ? data : 'Страница не найдена.')}
    action={
      <Button size="small" component={Link} to="/auctions">
        К списку аукционов
      </Button>
    }
  />
);
