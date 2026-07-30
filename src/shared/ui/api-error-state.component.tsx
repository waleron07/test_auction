import { ApiError, NetworkError } from '../api/api-error';

import { ErrorState } from './error-state.component';

interface ErrorPresentation {
  title: string;
  message: string;
  /** Показывать ли кнопку повтора: 401 повтором не лечится. */
  retryable: boolean;
}

/**
 * Разбирает ошибку в человеческий текст по коду контракта (⑯⑰).
 *
 * 401 и 503 объявлены у всех четырёх операций, 404 — у трёх, и сваливать их в
 * общее «Что-то пошло не так» значит терять единственную подсказку, которая
 * есть у пользователя: что делать дальше. Повторять 401 бессмысленно — нужна
 * авторизация; 503 и сетевой сбой повторить как раз стоит.
 */
const present = (error: unknown): ErrorPresentation => {
  if (error instanceof NetworkError) {
    return {
      title: 'Нет связи с сервером',
      message: error.message,
      retryable: true,
    };
  }

  if (error instanceof ApiError) {
    switch (error.status) {
      case 401:
        return { title: 'Сессия истекла', message: error.message, retryable: false };

      case 404:
        return { title: 'Не найдено', message: error.message, retryable: false };

      case 503:
        return { title: 'Сервис недоступен', message: error.message, retryable: true };

      default:
        return { title: error.title, message: error.message, retryable: true };
    }
  }

  return {
    title: 'Что-то пошло не так',
    message: error instanceof Error ? error.message : 'Неизвестная ошибка.',
    retryable: true,
  };
};

export interface ApiErrorStateProps {
  /** Ошибка из запроса или из boundary маршрута. */
  error: unknown;
  /** Обработчик повтора. Не рендерится, если повтор бессмыслен (401, 404). */
  onRetry?: (() => void) | undefined;
  /** Дополнительное действие рядом с повтором. */
  action?: React.ReactNode;
}

/**
 * Единый вид ошибки запроса: и для inline-состояний TanStack Query, и для
 * `errorComponent` маршрутов. Разбор кода — в одном месте, чтобы 401 везде
 * выглядел одинаково.
 */
export const ApiErrorState = ({ error, onRetry, action }: ApiErrorStateProps) => {
  const { title, message, retryable } = present(error);
  const traceId = error instanceof ApiError ? error.traceId : null;

  return (
    <ErrorState
      title={title}
      message={message}
      traceId={traceId}
      onRetry={retryable ? onRetry : undefined}
      action={action}
    />
  );
};
