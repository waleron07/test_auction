import { Button } from '@mui/material';
import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';

import { ErrorState } from './error-state.component';

/**
 * `errorComponent` маршрутов и `defaultErrorComponent` роутера.
 *
 * Ловит то, что уронило **рендер**: неучтённый `undefined`, ошибку в мапперe,
 * сбой загрузки чанка. Ошибки самих запросов сюда не поднимаются — они
 * остаются inline-состоянием TanStack Query, иначе сбой одного запроса унёс бы
 * весь экран вместо блока с кнопкой «Повторить» (ARCHITECTURE 5.1).
 */
export const RouteError = ({ error, reset }: ErrorComponentProps) => {
  const router = useRouter();
  const message = error instanceof Error ? error.message : 'Неизвестная ошибка';

  const handleRetry = () => {
    reset();
    void router.invalidate();
  };

  return (
    <ErrorState
      title="Что-то пошло не так"
      message={message}
      onRetry={handleRetry}
      action={
        <Button size="small" onClick={() => void router.navigate({ to: '/auctions' })}>
          К списку аукционов
        </Button>
      }
    />
  );
};
