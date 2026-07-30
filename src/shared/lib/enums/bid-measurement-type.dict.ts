import { type BidMeasurementTypeDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/**
 * Единица измерения ставки (㉚). Словарь — для подписей и фильтров; для
 * форматирования цены используется `resolvePriceUnit`, который сводит
 * `Unknown` и `null` к `PerRoute`.
 */
export const BID_MEASUREMENT_TYPE_DICT: EnumDict<NonNullable<BidMeasurementTypeDto>> = {
  PerRoute: { label: 'За рейс', color: 'default' },
  PerKm: { label: 'За километр', color: 'info' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};
