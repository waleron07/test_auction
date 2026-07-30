import { type AuctionListItemDto } from '@/shared/api/dto';
import { formatDateRange } from '@/shared/lib/date/format-date-range.util';
import { AUCTION_STATUS_DICT } from '@/shared/lib/enums/auction-status.dict';
import { AUCTION_TYPE_DICT } from '@/shared/lib/enums/auction-type.dict';
import { getEnumEntry } from '@/shared/lib/enums/get-enum-label.util';
import { TRADING_STATUS_DICT } from '@/shared/lib/enums/trading-status.dict';
import { formatPrice } from '@/shared/lib/number/format-price.util';
import { resolvePriceUnit } from '@/shared/lib/number/resolve-price-unit.util';
import { emptyToNull } from '@/shared/lib/string/empty-to-null.util';
import { DASH, NBSP } from '@/shared/lib/string/typography.const';

import { type AuctionCardVm } from '../model/auction.types';

/**
 * Число с единицей измерения либо прочерк.
 * @param value Значение из DTO.
 * @param unit Единица измерения — «т», «м³».
 * @returns Строка для карточки.
 */
const formatAmount = (value: number | null | undefined, unit: string): string =>
  value === null || value === undefined ? DASH : `${String(value)}${NBSP}${unit}`;

/**
 * Строка контракта либо прочерк: пустая строка в этой схеме означает «не
 * задано», а не пустое значение.
 * @param value Значение из DTO.
 * @returns Текст для карточки.
 */
const text = (value: string | null | undefined): string => emptyToNull(value) ?? DASH;

/**
 * Собирает ViewModel карточки списка из DTO.
 *
 * Здесь заканчивается зона, где поля могут отсутствовать: компонент получает
 * готовые строки. Три решения контракта живут именно тут, а не в разметке:
 * блок цены и блок «моя ставка» в списке nullable целиком (㉛), поэтому
 * отсутствие цены — это прочерк, а не выдуманный ноль; цена печатается с
 * единицей измерения, потому что при `PerKm` то же число значит другое (㉚);
 * скрытый организатор (㉖) подписывается явно, а не пропадает молча.
 * @param item Элемент ответа `POST /auctions/list`.
 * @returns ViewModel карточки.
 */
export const mapAuctionCard = (item: AuctionListItemDto): AuctionCardVm => {
  const main = item.main;
  const trading = item.trading;
  const cargo = item.cargo;
  const route = item.route;
  const unit = resolvePriceUnit(trading?.bid_measurement_type);
  const organizerName = emptyToNull(item.organizer?.organization_name);

  return {
    orderUid: main?.order_uid ?? '',
    cargoNum: text(main?.cargo_num),
    aucType: getEnumEntry(AUCTION_TYPE_DICT, main?.auc_type),
    status: getEnumEntry(AUCTION_STATUS_DICT, trading?.status),
    tradingStatus: getEnumEntry(TRADING_STATUS_DICT, trading?.status_mobile),
    organizer:
      item.organizer?.is_hide_organization === true
        ? 'Скрыт организатором'
        : (organizerName ?? DASH),
    route: `${text(route?.load?.city)} → ${text(route?.unload?.city)}`,
    loadDate: formatDateRange(route?.load?.date, null),
    unloadDate: formatDateRange(route?.unload?.date, null),
    cargo: {
      name: text(cargo?.name),
      weight: formatAmount(cargo?.weight, 'т'),
      volume: formatAmount(cargo?.volume, 'м³'),
      bodyType: text(cargo?.body_type),
    },
    // price === null означает «блока цены нет», а не «цена ноль» (㉛).
    price: formatPrice(trading?.price?.current ?? null, unit),
    // Суффикс «/км» не собирается руками: он часть единицы измерения, и
    // вторая копия строки разошлась бы с `formatPrice` при первой же правке.
    pricePerKm: formatPrice(main?.price_per_km, resolvePriceUnit('PerKm')),
    hasMyBet: trading?.your?.bet === true,
  };
};
