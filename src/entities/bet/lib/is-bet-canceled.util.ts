import { emptyToNull } from '@/shared/lib/string/empty-to-null.util';

/**
 * Определяет, отменена ли ставка.
 *
 * Схема не даёт единого булева признака: `is_rejected` и непустой
 * `cancel_reason` — два независимых способа отменить ставку, и оба
 * встречаются в данных по отдельности (⑫). Проверка признана истинной, если
 * истинен хотя бы один источник.
 * @param isRejected `BetItem.is_rejected`.
 * @param cancelReason `BetItem.cancel_reason` — пустая строка означает «не отменена» (⑫).
 * @returns `true`, если ставка отменена.
 */
export const isBetCanceled = (
  isRejected: boolean | null | undefined,
  cancelReason: string | null | undefined,
): boolean => isRejected === true || emptyToNull(cancelReason) !== null;
