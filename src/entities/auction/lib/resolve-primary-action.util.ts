import { type AuctionListItemDto } from '@/shared/api/dto';

/** Маршруты, на которые ведёт основное действие карточки. */
type ActionTarget = '/auctions/$auctionUuid/bet' | '/auctions/$auctionUuid/bets';

export interface PrimaryAction {
  /** Подпись кнопки. */
  label: string;
  /** Маршрут перехода. */
  to: ActionTarget;
  /** Кнопка отключена: торги закончились или отменены. */
  disabled: boolean;
  /** Причина отключения — она уходит в тултип. Пустая строка, если кнопка активна. */
  reason: string;
}

/** Статусы, при которых торги закончились: ставить уже нельзя. */
const CLOSED_STATUS_REASONS: Partial<Record<string, string>> = {
  Finished: 'Торги завершены.',
  Canceled: 'Аукцион отменён.',
  Stopped: 'Торги остановлены организатором.',
};

/**
 * Определяет основное действие карточки — требование задания про primary action.
 *
 * Функция чистая и живёт вне JSX, потому что это правило, а не разметка: в нём
 * четыре ветки, и каждая опирается на своё поле контракта. Отдельная ветка —
 * **отсутствие данных о торгах**: в списке `trading`, `trading.price` и
 * `trading.your` объявлены nullable (㉛), и карточка без них обязана всё равно
 * предложить осмысленное действие, а не отключённую кнопку без объяснения.
 *
 * Закрытые торги дают `disabled` **с причиной**: кнопка, которая не нажимается
 * и не объясняет почему, читается как поломка интерфейса.
 * @param item Элемент списка.
 * @returns Подпись, маршрут, признак отключения и причина.
 */
export const resolvePrimaryAction = (item: AuctionListItemDto): PrimaryAction => {
  const trading = item.trading;
  const closedReason = CLOSED_STATUS_REASONS[trading?.status ?? ''];

  if (closedReason !== undefined) {
    return {
      label: 'Смотреть ставки',
      to: '/auctions/$auctionUuid/bets',
      disabled: true,
      reason: closedReason,
    };
  }

  // Данных о своей ставке нет вовсе (㉛): подписать кнопку «Сделать» или
  // «Изменить» нечем — обе подписи были бы догадкой. Ведём смотреть ставки.
  if (trading?.your === null || trading?.your === undefined) {
    return {
      label: 'Смотреть ставки',
      to: '/auctions/$auctionUuid/bets',
      disabled: false,
      reason: '',
    };
  }

  if (trading.can_set_bet === true) {
    return {
      label: trading.your.bet === true ? 'Изменить ставку' : 'Сделать ставку',
      to: '/auctions/$auctionUuid/bet',
      disabled: false,
      reason: '',
    };
  }

  // Ставить нельзя — смотреть ставки можно всегда.
  return {
    label: 'Смотреть ставки',
    to: '/auctions/$auctionUuid/bets',
    disabled: false,
    reason: '',
  };
};
