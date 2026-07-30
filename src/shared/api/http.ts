import { API_BASE_URL } from '../config/api.config';

import { ApiError, NetworkError, ValidationApiError } from './api-error';
import { type ProblemDetailDto, type ValidationProblemDto } from './dto';

export interface RequestOptions {
  /** HTTP-метод. По умолчанию GET. */
  method?: 'GET' | 'POST';
  /** Тело запроса — сериализуется в JSON. */
  body?: unknown;
  /** Query-параметры. `undefined` и `null` не отправляются. */
  searchParams?: Record<string, string | number | boolean | null | undefined>;
  /** Сигнал отмены: TanStack Query передаёт свой при уходе со страницы. */
  signal?: AbortSignal;
}

/** Тело ошибки, каким его описывает контракт: `ProblemDetail` или его 422-вариант. */
type ProblemBody = ProblemDetailDto | ValidationProblemDto;

const isValidationProblem = (body: ProblemBody): body is ValidationProblemDto =>
  Array.isArray((body as ValidationProblemDto).errors);

const isProblemBody = (value: unknown): value is ProblemBody =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ProblemDetailDto).code === 'string' &&
  typeof (value as ProblemDetailDto).title === 'string' &&
  typeof (value as ProblemDetailDto).message === 'string';

const buildUrl = (path: string, searchParams: RequestOptions['searchParams']): string => {
  const url = `${API_BASE_URL}${path}`;

  if (searchParams === undefined) return url;

  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(searchParams)) {
    if (value === null || value === undefined) continue;

    query.set(key, String(value));
  }

  const queryString = query.toString();

  return queryString === '' ? url : `${url}?${queryString}`;
};

/**
 * Разбирает ответ с ошибкой в типизированное исключение (⑯).
 *
 * Тело ошибки может не прийти вовсе (прокси отдал HTML, соединение оборвалось),
 * поэтому форма тела проверяется, а не предполагается: иначе вместо «Сервис
 * недоступен» пользователь увидел бы `undefined`.
 */
const toApiError = async (response: Response): Promise<ApiError> => {
  const fallback: ProblemDetailDto = {
    code: 'unexpected_error',
    title: 'Ошибка сервиса',
    message: `Запрос завершился со статусом ${String(response.status)}.`,
  };

  let body: unknown;

  try {
    body = await response.json();
  } catch {
    return new ApiError(response.status, fallback);
  }

  if (!isProblemBody(body)) return new ApiError(response.status, fallback);

  // trace_id логируется всегда: на демонстрации это единственный способ
  // связать увиденную ошибку с записью в логах.
  if (body.trace_id !== null && body.trace_id !== undefined) {
    console.error(`[api] ${body.code} trace_id=${body.trace_id}`);
  }

  return isValidationProblem(body)
    ? new ValidationApiError(response.status, body)
    : new ApiError(response.status, body);
};

/**
 * Единственная точка выхода в сеть. Базовый путь — `/api/v1` из `servers[0].url`
 * схемы; JSON в обе стороны; ошибки — типизированные (`ApiError`,
 * `ValidationApiError`, `NetworkError`), а не «что вернул fetch».
 * @param path Путь операции без базового префикса, например `/auctions/list`.
 * @param options Метод, тело, query-параметры, сигнал отмены.
 * @returns Разобранное тело ответа.
 * @throws {ApiError} Ответ с кодом 4xx/5xx и телом `ProblemDetail`.
 * @throws {ValidationApiError} Ответ 422 с `errors[]`.
 * @throws {NetworkError} Сеть недоступна или тело не разобралось.
 */
export const request = async <TResponse>(
  path: string,
  options: RequestOptions = {},
): Promise<TResponse> => {
  const { method = 'GET', body, searchParams, signal } = options;

  let response: Response;

  try {
    response = await fetch(buildUrl(path, searchParams), {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal === undefined ? {} : { signal }),
    });
  } catch (cause) {
    // AbortError — не сбой сети, а осознанная отмена: пробрасываем как есть,
    // иначе TanStack Query покажет ошибку на уходе со страницы.
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause;

    throw new NetworkError('Не удалось связаться с сервером. Проверьте соединение.', { cause });
  }

  if (!response.ok) throw await toApiError(response);

  // 204 и ответы без схемы (`POST /bets` — ⑨) тела не содержат: читать его
  // и тем более на него опираться нельзя.
  if (response.status === 204) return undefined as TResponse;

  const text = await response.text();

  if (text === '') return undefined as TResponse;

  try {
    return JSON.parse(text) as TResponse;
  } catch (cause) {
    throw new NetworkError('Сервер вернул неразбираемый ответ.', { cause });
  }
};
