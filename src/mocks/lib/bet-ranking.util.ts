import { type BetItemDto } from '@/shared/api/dto';

/**
 * Признак отменённой ставки (⑫).
 *
 * Булева поля «отменена» в схеме нет: есть `is_rejected` и `cancel_reason`, где
 * **пустая строка** означает «не отменена» (не `null`). Правило живёт в одном
 * месте, потому что его читают и сид, и мутатор, и тесты: копия правила в тесте
 * означала бы, что тест проверяет сам себя.
 * @param bet Ставка.
 * @returns `true`, если ставка отменена.
 */
export const isBetCanceled = (bet: BetItemDto): boolean =>
  bet.is_rejected === true || (bet.cancel_reason ?? '') !== '';

/**
 * Лучшая ставка: на повышение — максимум, иначе минимум.
 * @param candidate Цена сравниваемой ставки.
 * @param incumbent Цена ставки, с которой сравниваем.
 * @param aucType Тип аукциона.
 * @returns `true`, если кандидат лучше.
 */
const isBetterPrice = (candidate: number, incumbent: number, aucType: string): boolean =>
  aucType === 'Up' ? candidate > incumbent : candidate < incumbent;

/**
 * Расставляет места в рейтинге и признак победителя по всем неотменённым ставкам.
 *
 * Направление зависит от типа аукциона, и это единственная формулировка правила
 * в проекте: сид и мутатор обязаны считать рейтинг одинаково, иначе после первой
 * же ставки места «до» и «после» окажутся посчитаны по разным правилам —
 * расхождение, которое не поймает ни один тест, потому что каждый смотрит на
 * свою половину.
 *
 * Отменённые ставки места не занимают, но остаются в списке с `place: null`:
 * они нужны UI для требований задания «признак отменённой ставки» и «причина
 * отмены» (㉙⑫).
 * @param bets Ставки аукциона; изменяются на месте.
 * @param aucType Тип аукциона.
 */
export const rankBets = (bets: BetItemDto[], aucType: string): void => {
  const active = bets.filter((bet) => !isBetCanceled(bet));

  active.sort((left, right) => {
    const leftPrice = left.price_with_vat ?? 0;
    const rightPrice = right.price_with_vat ?? 0;

    // При равных ценах впереди тот, кто поставил раньше.
    if (leftPrice === rightPrice) return (left.id ?? 0) - (right.id ?? 0);

    return isBetterPrice(leftPrice, rightPrice, aucType) ? -1 : 1;
  });

  active.forEach((bet, index) => {
    bet.place = index + 1;
    bet.is_win = index === 0;
  });

  for (const bet of bets) {
    if (isBetCanceled(bet)) bet.place = null;
  }
};
