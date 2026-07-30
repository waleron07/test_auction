import { type BadgeColor } from '@/shared/lib/enums/enum-dict.types';

/** Значение enum, подготовленное к рендеру: лейбл и цвет бейджа. */
export interface BadgeVm {
  label: string;
  color: BadgeColor;
}

/** Груз в карточке списка. Все поля — строки: прочерк вместо пустоты (⑫). */
export interface AuctionCargoVm {
  name: string;
  weight: string;
  volume: string;
  bodyType: string;
}

/**
 * ViewModel карточки списка.
 *
 * Ни одного опционального поля: компонент не решает, что делать с `undefined`,
 * — это работа маппера (㉜). Цены и даты уже отформатированы, потому что
 * формат зависит от единицы измерения (㉚) и от того, один ли это день, и
 * размазывать такие решения по разметке нельзя.
 */
export interface AuctionCardVm {
  orderUid: string;
  cargoNum: string;
  aucType: BadgeVm;
  status: BadgeVm;
  tradingStatus: BadgeVm;
  organizer: string;
  route: string;
  loadDate: string;
  unloadDate: string;
  cargo: AuctionCargoVm;
  /** Текущая цена с единицей измерения либо прочерк, если блока цены нет (㉛). */
  price: string;
  /** Цена за километр либо прочерк. */
  pricePerKm: string;
  /** Есть ли моя ставка. `trading.your === null` трактуется как «нет» (㉛). */
  hasMyBet: boolean;
}
