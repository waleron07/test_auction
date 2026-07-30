import { type AuctionTypeDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/**
 * Тип аукциона. Задание перечисляет `Request`, `Up`, `Down`, `FixPrice` —
 * ровно enum схемы плюс `Unknown`, которого в фильтре `auc_type` нет:
 * фильтровать по «неизвестно» нельзя, отображать — нужно (③).
 */
export const AUCTION_TYPE_DICT: EnumDict<NonNullable<AuctionTypeDto>> = {
  Request: { label: 'Запрос цены', color: 'info' },
  Up: { label: 'На повышение', color: 'success' },
  Down: { label: 'На понижение', color: 'warning' },
  FixPrice: { label: 'Фиксированная цена', color: 'primary' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};
