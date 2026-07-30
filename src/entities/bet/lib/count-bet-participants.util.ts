import { type BetItemDto } from '@/shared/api/dto';

import { isBetCanceled } from './is-bet-canceled.util';

/**
 * Считает количество участников торгов.
 *
 * В ответе счётчика нет, поэтому он выводится (⑬): уникальные
 * `organization_id` среди **неотменённых** ставок — отменённая ставка не
 * делает организацию участником торгов. Подсчёт не зависит от параметра
 * `all` запроса: при `all: false` отменённые ставки сервер и так не пришлёт,
 * при `all: true` их отсеивает сама функция — число участников не должно
 * прыгать при переключении «Показывать отменённые» (фаза 7).
 * @param bets Список ставок, как их отдаёт `GET /bets`.
 * @returns Число уникальных организаций-участников.
 */
export const countBetParticipants = (bets: BetItemDto[]): number => {
  const organizationIds = new Set<number>();

  for (const bet of bets) {
    if (isBetCanceled(bet.is_rejected, bet.cancel_reason)) continue;
    if (bet.organization_id !== undefined) organizationIds.add(bet.organization_id);
  }

  return organizationIds.size;
};
