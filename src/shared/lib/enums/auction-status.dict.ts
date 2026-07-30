import { type AuctionStatusDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/** Статус аукциона: все 9 значений enum'а, включая `Unknown`. */
export const AUCTION_STATUS_DICT: EnumDict<NonNullable<AuctionStatusDto>> = {
  Planning: { label: 'Планируется', color: 'default' },
  Auction: { label: 'Торги идут', color: 'primary' },
  DeterminateWinner: { label: 'Определение победителя', color: 'info' },
  WaitDeal: { label: 'Ожидание сделки', color: 'info' },
  InProgress: { label: 'В работе', color: 'success' },
  Finished: { label: 'Завершён', color: 'default' },
  Stopped: { label: 'Остановлен', color: 'warning' },
  Canceled: { label: 'Отменён', color: 'error' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};

/**
 * Числовые коды для фильтра `statuses` (②).
 *
 * `statuses` принимает `integer[]`, а enum `AuctionStatus` — строки, поэтому
 * соответствие приходится держать руками; в схеме его нет. `Unknown` кода не
 * имеет и в фильтр не уходит — фильтровать по «неизвестно» бессмысленно,
 * поэтому он исключён из типа, а не проставлен нулём.
 *
 * Расхождение с контрактом: описание `statuses` говорит «1–7», а кодируемых
 * значений восемь. Отправляем 1–8, расхождение зафиксировано в README.
 */
export const AUCTION_STATUS_CODE: Record<
  Exclude<NonNullable<AuctionStatusDto>, 'Unknown'>,
  number
> = {
  Planning: 1,
  Auction: 2,
  DeterminateWinner: 3,
  WaitDeal: 4,
  InProgress: 5,
  Finished: 6,
  Stopped: 7,
  Canceled: 8,
};
