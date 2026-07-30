import { type BetItemDto } from '@/shared/api/dto';
import { formatDateRange } from '@/shared/lib/date/format-date-range.util';
import { formatMoney } from '@/shared/lib/number/format-money.util';
import { emptyToNull } from '@/shared/lib/string/empty-to-null.util';
import { DASH } from '@/shared/lib/string/typography.const';
import { type VatMode } from '@/shared/model/vat-mode.store';

import { type BetVm } from '../model/bet.types';

import { isBetCanceled } from './is-bet-canceled.util';

/**
 * Приводит `BetItem` к `BetVm`.
 *
 * Цена ставки, в отличие от аукциона, не привязана к `bid_measurement_type`
 * (поле у `BetItem` отсутствует) — форматируется как обычная сумма, без
 * единицы измерения. Пара `price_with_vat`/`price_no_vat` выбирается вручную,
 * а не через `selectPrice` из `entities/auction`: сущности одного уровня FSD
 * не видят друг друга (тот же запрет, что нашёлся в фазе 6 у `OrganizerVm`).
 * @param bet Одна ставка из `BetListResponse.bets`.
 * @param vatMode Текущий режим отображения цены.
 * @param currentSubscriberId `subscriber_id` текущего пользователя — для подсветки своей ставки.
 * @returns ViewModel строки истории ставок.
 */
export const mapBet = (bet: BetItemDto, vatMode: VatMode, currentSubscriberId: number): BetVm => {
  const withVat = bet.price_with_vat ?? null;
  const noVat = bet.price_no_vat ?? null;
  const usedFallback = vatMode === 'without' && noVat === null && withVat !== null;
  const value = vatMode === 'with' ? withVat : (noVat ?? withVat);
  const canceled = isBetCanceled(bet.is_rejected, bet.cancel_reason);
  const vatRate = emptyToNull(bet.price_info?.vat_rate ?? null);

  return {
    id: bet.id ?? 0,
    createdAt: formatDateRange(bet.created_at, null),
    price: { text: formatMoney(value), isFallback: usedFallback },
    vatRate: vatRate === null ? DASH : `${vatRate}%`,
    organizationName: emptyToNull(bet.organization_name) ?? DASH,
    organizationInn: emptyToNull(bet.organization_inn) ?? DASH,
    place: bet.place ?? null,
    isWin: bet.is_win === true,
    isCanceled: canceled,
    cancelReason: canceled ? (emptyToNull(bet.cancel_reason) ?? 'Причина не указана') : null,
    isCounter: bet.is_counter === true,
    isMine: bet.subscriber_id === currentSubscriberId,
  };
};
