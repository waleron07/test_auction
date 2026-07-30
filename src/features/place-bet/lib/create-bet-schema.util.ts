import { z } from 'zod';

import {
  type AuctionShowTradingPriceDto,
  type AuctionTypeDto,
  type BidMeasurementTypeDto,
} from '@/shared/api/dto';
import { formatPrice } from '@/shared/lib/number/format-price.util';
import { isMultipleOf } from '@/shared/lib/number/is-multiple-of.util';
import { resolvePriceUnit } from '@/shared/lib/number/resolve-price-unit.util';

/** Значения формы ставки — единственное поле совпадает с `SetBetRequest`. */
export interface BetFormValues {
  price: number;
}

/**
 * Собирает Zod-схему формы ставки под конкретный аукцион.
 *
 * Фабрика, а не константа (0.3, уровень 2): правила зависят от `min`/`max`/
 * `step`/`available` — все nullable (⑦) — и от типа аукциона. Отсутствующее в
 * DTO ограничение не создаёт правила, а не отклоняет любую цену. Единственное
 * требование самой схемы контракта — `price > 0` (⑧: `SetBetRequest` не
 * объявляет `minimum`); оно же продублировано на сервере
 * (`src/mocks/lib/validate-bet.util.ts`) — фронтовая проверка не единственная
 * линия обороны.
 *
 * `allow_counter_bets` в правилах не участвует: по разбору контракта (㉘) это
 * чисто информационный флаг («встречная ставка» — чип в истории), а не
 * ограничение цены.
 * @param price Блок `trading.price`: `min`/`max`/`current`/`step`/`available`, все nullable.
 * @param aucType Тип аукциона — определяет направление цены и (для `FixPrice`) её точное значение.
 * @param bidMeasurementType Единица измерения цены (㉚) — для текста ошибок: «₽/км» вместо «за рейс».
 * @returns Zod-схема с полем `price`, готовая для `zodResolver`.
 */
export const createBetSchema = (
  price: AuctionShowTradingPriceDto | null | undefined,
  aucType: AuctionTypeDto,
  bidMeasurementType: BidMeasurementTypeDto | null | undefined,
): z.ZodType<BetFormValues, BetFormValues> => {
  const unit = resolvePriceUnit(bidMeasurementType);
  const min = price?.min ?? null;
  const max = price?.max ?? null;
  const current = price?.current ?? null;
  const step = price?.step ?? null;
  const available = price?.available ?? null;
  const stepBase = min ?? current;

  return z.object({
    price: z
      // Поле `type="number"` отдаёт `NaN` и на пустом значении, и на нечисловом
      // вводе, поэтому одно сообщение закрывает оба случая — и «цена
      // обязательна», и «введено не число».
      .number({ error: 'Введите цену.' })
      .positive('Цена должна быть больше нуля.')
      .superRefine((value, ctx) => {
        if (min !== null && value < min) {
          ctx.addIssue({
            code: 'custom',
            message: `Цена не может быть ниже ${formatPrice(min, unit)}.`,
          });
        }

        if (max !== null && value > max) {
          ctx.addIssue({
            code: 'custom',
            message: `Цена не может быть выше ${formatPrice(max, unit)}.`,
          });
        }

        if (stepBase !== null && !isMultipleOf(value - stepBase, step)) {
          ctx.addIssue({
            code: 'custom',
            message: `Цена должна отличаться от ${formatPrice(stepBase, unit)} на кратное ${formatPrice(step, unit)}.`,
          });
        }

        if (aucType === 'Down' && current !== null && value >= current) {
          ctx.addIssue({
            code: 'custom',
            message: `Аукцион на понижение: цена должна быть ниже ${formatPrice(current, unit)}.`,
          });
        }

        if (aucType === 'Up' && current !== null && value <= current) {
          ctx.addIssue({
            code: 'custom',
            message: `Аукцион на повышение: цена должна быть выше ${formatPrice(current, unit)}.`,
          });
        }

        if (aucType === 'FixPrice') {
          const fixed = available ?? current;

          if (fixed !== null && value !== fixed) {
            ctx.addIssue({
              code: 'custom',
              message: `Цена фиксирована: ${formatPrice(fixed, unit)}.`,
            });
          }
        }
      }),
  });
};
