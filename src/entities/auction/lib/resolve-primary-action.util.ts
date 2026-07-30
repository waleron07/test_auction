import { type AuctionListItemDto, type AuctionStatusDto } from '@/shared/api/dto';

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

/**
 * Статусы, при которых торги закончились: ставить уже нельзя.
 *
 * Ключи типизированы значениями enum'а, а не `string`: иначе переименование
 * статуса в схеме тихо превратило бы «кнопка отключена с причиной» в
 * «кнопка активна», и заметить это было бы нечем.
 */
const CLOSED_STATUS_REASONS: Partial<Record<NonNullable<AuctionStatusDto>, string>> = {
  Finished: 'Торги завершены.',
  Canceled: 'Аукцион отменён.',
  Stopped: 'Торги остановлены организатором.',
};

/** Действие по умолчанию: смотреть ставки можно всегда. */
const VIEW_BETS: PrimaryAction = {
  label: 'Смотреть ставки',
  to: '/auctions/$auctionUuid/bets',
  disabled: false,
  reason: '',
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
  const status = trading?.status;
  const closedReason = status === undefined ? undefined : CLOSED_STATUS_REASONS[status];

  if (closedReason !== undefined) return { ...VIEW_BETS, disabled: true, reason: closedReason };

  // Ставить можно только когда это разрешено **и** известно, есть ли своя
  // ставка: при пустом `your` (㉛) подпись «Сделать» или «Изменить» была бы
  // догадкой, поэтому карточка ведёт смотреть ставки.
  if (trading?.can_set_bet === true && trading.your !== null && trading.your !== undefined) {
    return {
      label: trading.your.bet === true ? 'Изменить ставку' : 'Сделать ставку',
      to: '/auctions/$auctionUuid/bet',
      disabled: false,
      reason: '',
    };
  }

  return VIEW_BETS;
};
