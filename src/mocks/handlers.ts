import { delay, http, HttpResponse, type RequestHandler } from 'msw';

import {
  type AuctionListRequestDto,
  type AuctionListResponseDto,
  type AuctionShowResponseDto,
  type BetListResponseDto,
  type ProblemDetailDto,
  type SetBetRequestDto,
  type ValidationErrorDto,
  type ValidationProblemDto,
} from '@/shared/api/dto';
import { API_BASE_URL } from '@/shared/config/api.config';
// Соответствие «статус аукциона ↔ числовой код» в схеме не описано (②), оно
// принято проектом. Мок читает тот же словарь, что и request builder: две
// независимые копии соглашения разошлись бы, и фильтр молча возвращал бы не то.
import { AUCTION_STATUS_CODE } from '@/shared/lib/enums/auction-status.dict';

import { isBetCanceled } from './lib/bet-ranking.util';
import { fromNaiveDateTime } from './lib/naive-date.util';
import { toListItem } from './lib/to-list-item.util';
import { toShowResponse } from './lib/to-show-response.util';
import { validateBet } from './lib/validate-bet.util';
import { MOCK_DELAY_MS } from './mock.config';
import { type AuctionEntity } from './model/auction-entity.types';
import { ERROR_TRIGGER_UIDS } from './seed';
import { getAuction, getAuctions, getBets, placeBet } from './store';

/** Максимальный размер страницы: за ним начинается 422. */
const MAX_PER_PAGE = 100;

/** Идентификатор запроса для корреляции с логами (⑯). */
const traceId = (): string => `trace-${String(Date.now())}`;

/**
 * Ошибки контракта таблицей: у всех четырёх операций объявлены 401 и 503, у
 * трёх — 404 (⑯⑰). Перечисление их фабриками означало бы копию тела ответа на
 * каждый код и четыре места правки при смене формата `trace_id`.
 */
const PROBLEMS = {
  unauthorized: {
    status: 401,
    code: 'unauthorized',
    title: 'Сессия истекла',
    message: 'Требуется повторная авторизация.',
  },
  serviceUnavailable: {
    status: 503,
    code: 'service_unavailable',
    title: 'Сервис недоступен',
    message: 'Upstream временно недоступен. Попробуйте повторить запрос.',
  },
  notFound: {
    status: 404,
    code: 'resource_not_found',
    title: 'Не найдено',
    message: 'Аукцион не найден или у вас нет к нему доступа.',
  },
} as const;

type ProblemKind = keyof typeof PROBLEMS;

const problem = (kind: ProblemKind) => {
  const { status, ...body } = PROBLEMS[kind];

  return HttpResponse.json<ProblemDetailDto>({ ...body, trace_id: traceId() }, { status });
};

const validationProblem = (errors: ValidationErrorDto[]) =>
  HttpResponse.json<ValidationProblemDto>(
    {
      code: 'validation_failed',
      title: 'Ошибка валидации',
      message: 'Проверьте переданные значения.',
      trace_id: traceId(),
      errors,
    },
    { status: 422 },
  );

/**
 * Ответ-триггер для аукционов, существующих ради проверки 401 и 503 (⑰).
 *
 * Триггером служит сам аукцион, а не переключатель в интерфейсе: ссылка на него
 * воспроизводима, и проверяющий видит экран ошибки, просто открыв её.
 * @param orderUid Идентификатор из маршрута.
 * @returns Ответ с ошибкой либо `null`, если аукцион обычный.
 */
const ERROR_TRIGGERS: Record<string, ProblemKind> = {
  [ERROR_TRIGGER_UIDS.unauthorized]: 'unauthorized',
  [ERROR_TRIGGER_UIDS.serviceUnavailable]: 'serviceUnavailable',
};

const errorTriggerResponse = (orderUid: string) => {
  const kind = ERROR_TRIGGERS[orderUid];

  return kind === undefined ? null : problem(kind);
};

/** Задержка, чтобы skeleton'ы и pending-состояния были видимы при проверке. */
const respondSlowly = async (): Promise<void> => {
  const { min, max } = MOCK_DELAY_MS;

  // `delay(0)` — это всё равно реальный таймер MSW: в тестах он съедал
  // две трети времени каждого мокового ответа.
  if (max === 0) return;

  await delay(min + Math.random() * (max - min));
};

const matchesText = (value: string, filter: string | undefined): boolean =>
  filter === undefined || filter === '' || value.toLowerCase().includes(filter.toLowerCase());

const matchesDateRange = (
  value: string,
  from: string | undefined,
  to: string | undefined,
): boolean => {
  const date = fromNaiveDateTime(value);

  if (date === null) return true;

  if (from !== undefined && from !== '' && date.getTime() < Date.parse(from)) return false;

  if (to !== undefined && to !== '' && date.getTime() > Date.parse(to)) return false;

  return true;
};

const matchesNumberRange = (
  value: number | null,
  from: number | null | undefined,
  to: number | null | undefined,
): boolean => {
  if (from !== null && from !== undefined && (value === null || value < from)) return false;

  if (to !== null && to !== undefined && (value === null || value > to)) return false;

  return true;
};

/** Значение входит в фильтр-массив; пустой или отсутствующий фильтр пропускает всё. */
const matchesOneOf = <T>(value: T | undefined, filter: readonly T[] | undefined): boolean =>
  filter === undefined || filter.length === 0 || (value !== undefined && filter.includes(value));

/** Булев фильтр: `true` требует признака, остальные значения не ограничивают. */
const matchesFlag = (wanted: boolean | undefined, actual: boolean | undefined): boolean =>
  wanted !== true || actual === true;

/**
 * Применяет фильтры запроса к **канонической сущности**, а не к проекции списка.
 *
 * Это принципиально: `toListItem` намеренно вырождает `status_mobile` из девяти
 * значений в шесть (③), а `price` и `your` умеет отдавать `null` (㉛). Фильтруя
 * проекцию, мок отвечал бы «ничего не найдено» на легальный запрос
 * `status: ['OnPending']` — фильтр в схеме принимает все девять значений — и
 * прятал бы аукционы без блока цены от фильтров по цене. Проекция применяется
 * последней, только к странице выдачи: она способ сериализации, а не источник
 * данных для логики.
 *
 * `status` фильтрует по **торговому статусу пользователя**, а `statuses` — по
 * статусу аукциона числовыми кодами: это разные сущности, и путать их — самая
 * дорогая ловушка контракта (①②). `mobile_statuses` не поддерживается
 * намеренно — он дубль `status`, и слать оба значит конфликтовать с собой.
 * @param entity Каноническая сущность аукциона.
 * @param request Тело запроса списка.
 * @returns `true`, если аукцион проходит все фильтры.
 */
const matchesFilters = (entity: AuctionEntity, request: AuctionListRequestDto): boolean => {
  const { detail, listOnly } = entity;
  const { main, trading, cargo } = detail;

  if (!matchesText(main.cargo_num ?? '', request.cargo_num)) return false;

  // Enum фильтра `auc_type` не содержит Unknown (③): аукцион с неизвестным типом
  // под фильтр по типу не попадает никогда — это поведение контракта.
  const filterableAucType = main.auc_type === 'Unknown' ? undefined : main.auc_type;

  if (!matchesOneOf(filterableAucType, request.auc_type)) return false;

  // Статус берётся из detail: все девять значений, а не шесть из проекции.
  if (!matchesOneOf(trading.status_mobile, request.status)) return false;

  const statusCode =
    trading.status === undefined || trading.status === 'Unknown'
      ? undefined
      : AUCTION_STATUS_CODE[trading.status];

  if (!matchesOneOf(statusCode, request.statuses)) return false;

  if (!matchesText(listOnly.load.city, request.load_city)) return false;

  if (!matchesText(listOnly.unload.city, request.unload_city)) return false;

  if (request.load_gc_id !== undefined && listOnly.load.cityGcId !== request.load_gc_id) {
    return false;
  }

  if (request.unload_gc_id !== undefined && listOnly.unload.cityGcId !== request.unload_gc_id) {
    return false;
  }

  if (!matchesDateRange(listOnly.load.date, request.load_date_from, request.load_date_to)) {
    return false;
  }

  if (!matchesFlag(request.is_available, listOnly.isAvailable)) return false;

  if (!matchesFlag(request.is_bidder, trading.is_bidder)) return false;

  if (!matchesFlag(request.is_favorite, trading.is_favorite)) return false;

  if (
    !matchesNumberRange(
      trading.price?.current ?? null,
      request.current_price_from,
      request.current_price_to,
    )
  ) {
    return false;
  }

  if (
    !matchesNumberRange(
      trading.price?.price_per_km ?? null,
      request.price_per_km_from,
      request.price_per_km_to,
    )
  ) {
    return false;
  }

  if (!matchesNumberRange(listOnly.cargoWeight, request.weight_from, request.weight_to)) {
    return false;
  }

  if (!matchesNumberRange(listOnly.cargoVolume, request.volume_from, request.volume_to)) {
    return false;
  }

  if (!matchesOneOf(cargo.body_type, request.body_types)) return false;

  return true;
};

/** Параметры пути операций, работающих с одним аукционом. */
interface AuctionPathParams {
  auctionUuid: string;
}

/** Операция без параметров пути. */
type NoPathParams = Record<string, never>;

/**
 * Тело ответа приходится перечислять объединением: у каждой операции контракта
 * несколько форм ответа (успех, `ProblemDetail`, `ValidationProblem`), и без
 * явного объединения MSW выводит тип по первой встреченной ветке.
 */
/** Обработчики четырёх операций контракта. */
export const handlers: RequestHandler[] = [
  http.post<NoPathParams, AuctionListRequestDto, AuctionListResponseDto | ValidationProblemDto>(
    `${API_BASE_URL}/auctions/list`,
    async ({ request }) => {
      await respondSlowly();

      const body = await request.json();
      const perPage = body.per_page ?? 20;
      const page = body.page ?? 1;

      // Невалидный per_page — 422 с указанием поля: ветка обработки ошибок
      // валидации должна быть достижима не только на форме ставки.
      if (!Number.isInteger(perPage) || perPage < 1 || perPage > MAX_PER_PAGE) {
        return validationProblem([
          {
            field: 'per_page',
            message: `Допустимый размер страницы — от 1 до ${String(MAX_PER_PAGE)}.`,
            code: 'out_of_range',
          },
        ]);
      }

      if (!Number.isInteger(page) || page < 1) {
        return validationProblem([
          {
            field: 'page',
            message: 'Номер страницы должен быть положительным.',
            code: 'min_value',
          },
        ]);
      }

      const matched = getAuctions().filter((entity) => matchesFilters(entity, body));

      // is_oldest переворачивает порядок: сначала самые старые.
      matched.sort(
        (left, right) =>
          (body.is_oldest === true ? -1 : 1) *
          (left.listOnly.prioritySort - right.listOnly.prioritySort),
      );

      const total = matched.length;
      const lastPage = Math.max(Math.ceil(total / perPage), 1);
      const from = (page - 1) * perPage;
      // Проекция — последний шаг, только для страницы выдачи.
      const pageItems = matched.slice(from, from + perPage).map(toListItem);

      return HttpResponse.json<AuctionListResponseDto>({
        data: pageItems,
        // Числа meta считаются, а не выдумываются: клиент берёт из них
        // last_page и не вычисляет число страниц сам (⑥).
        meta: {
          current_page: page,
          from: pageItems.length === 0 ? 0 : from + 1,
          last_page: lastPage,
          per_page: perPage,
          to: from + pageItems.length,
          total,
        },
      });
    },
  ),

  http.get<AuctionPathParams, never, AuctionShowResponseDto | ProblemDetailDto>(
    `${API_BASE_URL}/auctions/:auctionUuid`,
    async ({ params }) => {
      await respondSlowly();

      const orderUid = params.auctionUuid;
      const triggered = errorTriggerResponse(orderUid);

      if (triggered !== null) return triggered;

      const entity = getAuction(orderUid);

      if (entity === undefined) return problem('notFound');

      return HttpResponse.json(toShowResponse(entity));
    },
  ),

  http.get<AuctionPathParams, never, BetListResponseDto | ProblemDetailDto>(
    `${API_BASE_URL}/auctions/:auctionUuid/bets`,
    async ({ params, request }) => {
      await respondSlowly();

      const orderUid = params.auctionUuid;
      const triggered = errorTriggerResponse(orderUid);

      if (triggered !== null) return triggered;

      const entity = getAuction(orderUid);

      if (entity === undefined) return problem('notFound');

      // Параметр all читается из query: без него отменённые ставки не приходят,
      // и требования задания «признак отмены» и «причина» недостижимы (㉙).
      const all = new URL(request.url).searchParams.get('all') === 'true';
      const bets = getBets(entity);

      // 403 у операции не предусмотрен: скрытость истории — решение клиента
      // по данным detail (⑪), поэтому здесь фильтруется только `all`.
      return HttpResponse.json<BetListResponseDto>({
        bets: all ? bets : bets.filter((bet) => !isBetCanceled(bet)),
      });
    },
  ),

  http.post<
    AuctionPathParams,
    SetBetRequestDto,
    { id: number } | ProblemDetailDto | ValidationProblemDto
  >(`${API_BASE_URL}/auctions/:auctionUuid/bets`, async ({ params, request }) => {
    await respondSlowly();

    const orderUid = params.auctionUuid;
    const triggered = errorTriggerResponse(orderUid);

    if (triggered !== null) return triggered;

    const entity = getAuction(orderUid);

    if (entity === undefined) return problem('notFound');

    const body: unknown = await request.json();
    const price: unknown = (body as { price?: unknown } | null)?.price;
    const errors = validateBet(entity.detail, price);

    if (errors.length > 0) return validationProblem(errors);

    const { bet } = placeBet(entity, price as number);

    // Схемы ответа у операции нет — «проксируется от upstream» (⑨). Тело
    // намеренно минимальное: клиент обязан читать результат инвалидацией,
    // а не разбирать этот ответ.
    return HttpResponse.json({ id: bet.id ?? 0 }, { status: 200 });
  }),
];
