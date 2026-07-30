import { type VatMode } from '@/shared/model/vat-mode.store';

export interface PricePair {
  /** Базовое значение схемы — с НДС (`current`, `min`, `step`, …). */
  withVat: number | null | undefined;
  /** Близнец `*_no_vat`. В проекции списка есть только у `current` (㉓). */
  noVat: number | null | undefined;
}

export interface SelectedPrice {
  /** Выбранное значение либо `null`, если пара пуста целиком (㉛). */
  value: number | null;
  /**
   * Показано базовое значение вместо запрошенного «без НДС»: близнеца в этой
   * проекции нет. UI обязан поставить пометку «с НДС», иначе число врёт.
   */
  usedFallback: boolean;
}

/**
 * Выбирает половину ценовой пары по режиму НДС (⑦).
 *
 * Все цены в схеме идут парами `*_with_vat` / `*_no_vat`, и обе половины
 * nullable. Выбор сосредоточен здесь, а не в компонентах: иначе каждый из них
 * решал бы сам, что делать с отсутствующим близнецом, и в одном месте появился
 * бы прочерк, в другом — молча цена с НДС под подписью «без НДС».
 * @param pair Пара значений из DTO.
 * @param vatMode Текущий режим отображения.
 * @returns Значение и признак того, что пришлось взять базовое.
 */
export const selectPrice = (pair: PricePair, vatMode: VatMode): SelectedPrice => {
  const withVat = pair.withVat ?? null;
  const noVat = pair.noVat ?? null;

  if (vatMode === 'with') return { value: withVat, usedFallback: false };

  if (noVat !== null) return { value: noVat, usedFallback: false };

  return { value: withVat, usedFallback: withVat !== null };
};
