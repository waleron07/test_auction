import { type PaymentDelayTypeDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/**
 * Тип отсрочки платежа. Лейблы в родительном падеже: значение подставляется
 * после числа — «30 календарных дней».
 *
 * В отличие от остальных enum'ов, этот в схеме объявлен `nullable`, поэтому
 * ключи словаря берутся из `NonNullable`, а `null` обрабатывается фолбэком
 * `getEnumLabel`.
 */
export const PAYMENT_DELAY_TYPE_DICT: EnumDict<NonNullable<PaymentDelayTypeDto>> = {
  CalendarDays: { label: 'календарных дней', color: 'default' },
  WorkDays: { label: 'рабочих дней', color: 'default' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};
