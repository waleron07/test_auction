import { type AuctionShowResponseDto, type ValidationErrorDto } from '@/shared/api/dto';

/** Допуск сравнения кратности: шаг может быть дробным. */
const EPSILON = 1e-9;

/** Ценовые ограничения аукциона, приведённые к `number | null`. */
interface PriceLimits {
  min: number | null;
  max: number | null;
  current: number | null;
  step: number | null;
}

/**
 * Собирает ошибку по полю `price`.
 *
 * У `SetBetRequest` одно поле (⑧), поэтому `field` всегда одинаков, и повторять
 * его в каждой ветке значит прятать различия между правилами за одинаковым шумом.
 * @param code Машиночитаемый код нарушения.
 * @param message Текст для пользователя.
 * @returns Ошибка в формате `ValidationProblem.errors` (⑯).
 */
const priceError = (code: string, message: string): ValidationErrorDto => ({
  field: 'price',
  code,
  message,
});

/**
 * Нижняя граница цены.
 * @param price Цена из запроса.
 * @param limits Ценовые ограничения аукциона.
 * @returns Ошибки правила; пустой массив — правило соблюдено или неприменимо.
 */
const validateMin = (price: number, limits: PriceLimits): ValidationErrorDto[] => {
  const { min } = limits;

  if (min === null || price >= min) return [];

  return [priceError('min_value', `Цена не может быть ниже ${String(min)}.`)];
};

/**
 * Верхняя граница цены.
 * @param price Цена из запроса.
 * @param limits Ценовые ограничения аукциона.
 * @returns Ошибки правила; пустой массив — правило соблюдено или неприменимо.
 */
const validateMax = (price: number, limits: PriceLimits): ValidationErrorDto[] => {
  const { max } = limits;

  if (max === null || price <= max) return [];

  return [priceError('max_value', `Цена не может быть выше ${String(max)}.`)];
};

/**
 * Кратность шагу торгов.
 *
 * Сравнение с допуском, а не `% === 0`: шаг из схемы может быть дробным, и
 * двоичная арифметика отклоняла бы корректную ставку.
 * @param price Цена из запроса.
 * @param limits Ценовые ограничения аукциона.
 * @returns Ошибки правила; пустой массив — правило соблюдено или неприменимо.
 */
const validateStep = (price: number, limits: PriceLimits): ValidationErrorDto[] => {
  const { min, current, step } = limits;

  // Неположительный шаг — не ограничение, а испорченные данные; инвариант сида
  // проверяется при его сборке, здесь такой шаг просто не создаёт правила.
  if (step === null || step <= 0) return [];

  const base = min ?? current ?? 0;
  const remainder = Math.abs((price - base) % step);
  const isMultiple = remainder <= EPSILON || Math.abs(remainder - step) <= EPSILON;

  if (isMultiple) return [];

  return [
    priceError(
      'step_mismatch',
      `Цена должна отличаться от ${String(base)} на кратное ${String(step)}.`,
    ),
  ];
};

/**
 * Направление торгов: `Down` — только ниже текущей цены, `Up` — только выше.
 *
 * Для `Request` и `FixPrice` направление не ограничено: у первого цена
 * запрашивается, у второго фиксирована.
 * @param price Цена из запроса.
 * @param limits Ценовые ограничения аукциона.
 * @param aucType Тип аукциона.
 * @returns Ошибки правила; пустой массив — правило соблюдено или неприменимо.
 */
const validateDirection = (
  price: number,
  limits: PriceLimits,
  aucType: AuctionShowResponseDto['main']['auc_type'],
): ValidationErrorDto[] => {
  const { current } = limits;

  if (current === null) return [];

  switch (aucType) {
    case 'Down':
      return price < current
        ? []
        : [
            priceError(
              'direction_mismatch',
              `Аукцион на понижение: цена должна быть ниже ${String(current)}.`,
            ),
          ];

    case 'Up':
      return price > current
        ? []
        : [
            priceError(
              'direction_mismatch',
              `Аукцион на повышение: цена должна быть выше ${String(current)}.`,
            ),
          ];

    default:
      return [];
  }
};

/**
 * Серверная валидация ставки — та, которую делает бэкенд, а не форма.
 *
 * Существует отдельно от Zod-схемы формы намеренно: ограничение «> 0» в
 * контракте задано **только описанием** `SetBetRequest.price` (⑧), никаких
 * `minimum` в схеме нет. Значит проверка обязана быть серверной, а фронтовая —
 * её дубль для удобства, а не единственная линия обороны. Без этого мока
 * ветка обработки 422 в форме осталась бы непроверенной.
 *
 * Порядок: сначала отсекающие проверки (тип, знак, доступность торгов) — они
 * возвращают одну ошибку и делают остальные бессмысленными. Затем бизнес-правила
 * цены, каждое своей функцией: их результаты складываются, потому что
 * пользователю полезно увидеть все нарушения сразу, а не по одному за запрос.
 * @param detail Аукцион, на который ставят.
 * @param price Цена из тела запроса — приходит как `unknown`, тело не типизировано.
 * @returns Список ошибок в формате `ValidationProblem.errors` (⑯); пустой — ставка принята.
 */
export const validateBet = (
  detail: AuctionShowResponseDto,
  price: unknown,
): ValidationErrorDto[] => {
  if (typeof price !== 'number' || !Number.isFinite(price)) {
    return [priceError('invalid_type', 'Цена должна быть числом.')];
  }

  if (price <= 0) {
    return [priceError('min_value', 'Цена должна быть больше нуля.')];
  }

  if (detail.trading.can_set_bet !== true) {
    return [priceError('bet_not_allowed', 'Ставки по этому аукциону недоступны.')];
  }

  const limits: PriceLimits = {
    min: detail.trading.price?.min ?? null,
    max: detail.trading.price?.max ?? null,
    current: detail.trading.price?.current ?? null,
    step: detail.trading.price?.step ?? null,
  };

  return [
    ...validateMin(price, limits),
    ...validateMax(price, limits),
    ...validateStep(price, limits),
    ...validateDirection(price, limits, detail.main.auc_type),
  ];
};
