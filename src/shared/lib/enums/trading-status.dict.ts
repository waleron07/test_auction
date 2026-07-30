import { type TradingStatusDto } from '../../api/dto';

import { type EnumDict } from './enum-dict.types';

/**
 * Торговый статус пользователя — по **расширенному** набору из 9 значений (③).
 *
 * Инлайновый enum `AuctionListItemTrading.status_mobile` объявляет только 6
 * (без `OnPending`, `ChoosingWinner`, `Accepted`), а текстовые описания в схеме
 * не совпадают ни с одним из двух наборов. Словарь строится по общей схеме
 * `TradingStatus`: лишние ключи безвредны, недостающие дали бы пустой бейдж на
 * детальной странице.
 */
export const TRADING_STATUS_DICT: EnumDict<NonNullable<TradingStatusDto>> = {
  NotParticipating: { label: 'Не участвую', color: 'default' },
  Leading: { label: 'Лидирую', color: 'success' },
  Losing: { label: 'Проигрываю', color: 'error' },
  OnPending: { label: 'На рассмотрении', color: 'warning' },
  Confirmed: { label: 'Подтверждена', color: 'info' },
  ChoosingWinner: { label: 'Выбор победителя', color: 'info' },
  Winner: { label: 'Победитель', color: 'success' },
  Accepted: { label: 'Принята', color: 'success' },
  Unknown: { label: 'Неизвестно', color: 'default' },
};
