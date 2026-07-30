import { useNavigate } from '@tanstack/react-router';
import { useCallback } from 'react';

import { parseAuctionSearch } from '../lib/parse-auction-search.util';

import { type AuctionSearch } from './auction-search.schema';

/** Значения, которые не нужно писать в URL: они и так дефолтные. */
const isEmptyValue = (value: unknown): boolean =>
  value === undefined ||
  value === '' ||
  value === false ||
  (Array.isArray(value) && value.length === 0);

/**
 * Записывает фильтры в адресную строку.
 *
 * Ссылка — источник правды: состояние фильтров живёт в URL, а не в компоненте,
 * поэтому «назад» работает, ссылку можно прислать коллеге, а перезагрузка
 * ничего не теряет (решение 0.3).
 *
 * Три правила, без которых URL быстро становится нечитаемым или, хуже,
 * перестаёт слушаться:
 *
 * 1. **Адрес нормализуется при первом же изменении.** Роутер сохраняет ключи в
 *    том виде, в каком они пришли, поэтому у ссылки вида `?is_available=true`
 *    после записи камелкейсного `isAvailable` оказалось бы два ключа с одним
 *    смыслом — и сброс фильтра не сработал бы, потому что разбор предпочитает
 *    snake_case. Поэтому следующее состояние собирается из **разобранного**
 *    предыдущего, а не из сырого.
 * 2. Пустые значения из адреса **убираются**, а не пишутся как `cargo_num=`.
 * 3. Любое изменение фильтра сбрасывает страницу на первую — иначе
 *    пользователь остаётся на седьмой странице выдачи, в которой после
 *    фильтрации две страницы, и видит пустой экран.
 * @returns Функция обновления фильтров.
 */
export const useFiltersSync = (): ((patch: Partial<AuctionSearch>) => void) => {
  const navigate = useNavigate({ from: '/auctions/' });

  return useCallback(
    (patch: Partial<AuctionSearch>) => {
      void navigate({
        to: '/auctions',
        search: (previous: AuctionSearch) => {
          // Разбор предыдущего состояния схлопывает оба написания ключей в одно.
          const merged: Record<string, unknown> = { ...parseAuctionSearch(previous), ...patch };

          // Смена любого фильтра, кроме самой страницы, возвращает на первую.
          if (!('page' in patch)) merged.page = 1;

          // Пустые значения не пишутся в адрес, а выбрасываются: пересборка
          // объекта вместо delete — то же самое, но без мутации на лету.
          const next = Object.fromEntries(
            Object.entries(merged).filter(([, value]) => !isEmptyValue(value)),
          );

          return next;
        },
        replace: true,
      });
    },
    [navigate],
  );
};
