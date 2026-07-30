/**
 * Цена ставки, уже выбранная по режиму НДС.
 *
 * Структурно совпадает с `PriceFieldVm` из `entities/auction`, но объявлена
 * своим типом: сущности одного уровня FSD не видят друг друга (правило
 * `no-restricted-imports`, найдено в фазе 6 — `entities/organizer` по той же
 * причине не переиспользует типы `entities/auction`). Совпадение формы —
 * следствие границы слоя, а не дублирование по недосмотру.
 */
export interface BetPriceVm {
  text: string;
  /** Показано базовое значение «с НДС»: близнеца `price_no_vat` нет (⑦). */
  isFallback: boolean;
}

/**
 * ViewModel одной ставки из истории.
 *
 * Ни одного опционального поля (㉜): `BetItem` почти целиком состоит из
 * необязательных полей схемы, тотализация — работа `mapBet`.
 */
export interface BetVm {
  id: number;
  createdAt: string;
  price: BetPriceVm;
  /** Ставка НДС из `price_info.vat_rate`, например «20%», либо прочерк. */
  vatRate: string;
  organizationName: string;
  organizationInn: string;
  /** Место в рейтинге. `null`, если ставка отменена или места нет. */
  place: number | null;
  isWin: boolean;
  isCanceled: boolean;
  /** Причина отмены, если `isCanceled`; иначе `null` (⑫). */
  cancelReason: string | null;
  isCounter: boolean;
  /** Ставка текущего пользователя — сравнение по `subscriber_id`. */
  isMine: boolean;
}
