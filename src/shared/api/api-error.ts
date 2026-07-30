import { type ProblemDetailDto, type ValidationErrorDto, type ValidationProblemDto } from './dto';

/**
 * Ошибка API с телом `ProblemDetail` (⑯): 401, 404, 503 и всё прочее, что
 * приходит по контракту. `status` хранится отдельно от `code`, потому что в
 * теле HTTP-код не дублируется, а решения UI (401 → «сессия истекла»,
 * 503 → «повторить») принимаются по нему.
 */
export class ApiError extends Error {
  /** HTTP-статус ответа. */
  readonly status: number;
  /** Машиночитаемый код из тела, стабилен между релизами. */
  readonly code: string;
  /** Короткое название типа ошибки — заголовок для UI. */
  readonly title: string;
  /** Идентификатор запроса для корреляции с логами. */
  readonly traceId: string | null;

  constructor(status: number, problem: ProblemDetailDto) {
    super(problem.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = problem.code;
    this.title = problem.title;
    this.traceId = problem.trace_id ?? null;
  }
}

/**
 * 422 с разбором по полям (⑯). `field` — snake_case-путь с точками для
 * вложенности; для формы ставки поле одно (`price`), но ошибки по незнакомым
 * полям обязаны не теряться, а уходить в общий алерт.
 */
export class ValidationApiError extends ApiError {
  /** Ошибки по полям, как их присылает сервер. */
  readonly errors: ValidationErrorDto[];

  constructor(status: number, problem: ValidationProblemDto) {
    super(status, problem);
    this.name = 'ValidationApiError';
    this.errors = problem.errors;
  }

  /**
   * Сворачивает `errors[]` в карту «поле → сообщение» для `setError` формы.
   * При нескольких ошибках на одно поле остаётся первая: показывать сразу две
   * под одним полем некуда.
   * @returns Карта «путь поля → сообщение».
   */
  toFieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};

    for (const error of this.errors) {
      result[error.field] ??= error.message;
    }

    return result;
  }
}

/**
 * Сеть недоступна, запрос оборван, тело не разобралось. Отдельный тип, потому
 * что для UI это не «ошибка сервера», а «повторите попытку».
 */
export class NetworkError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

/**
 * Сужает `unknown` из `catch` до ошибки API.
 * @param error Пойманное значение.
 * @returns `true`, если это `ApiError` или его наследник.
 */
export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/**
 * Сужает `unknown` до ошибки валидации 422.
 * @param error Пойманное значение.
 * @returns `true`, если это `ValidationApiError`.
 */
export const isValidationApiError = (error: unknown): error is ValidationApiError =>
  error instanceof ValidationApiError;
