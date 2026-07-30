import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { postAuctionBet } from '@/entities/bet';
import { isValidationApiError } from '@/shared/api/api-error';
import { auctionKeys } from '@/shared/api/query-keys';
import { useToast } from '@/shared/lib/toast/use-toast.hook';

import {
  mapValidationErrors,
  type MappedValidationErrors,
} from '../lib/map-validation-errors.util';

export interface UsePlaceBetMutationOptions {
  /** `order_uid` аукциона из маршрута. */
  auctionUuid: string;
  /** Вызывается на 422 (⑯) — форма проставляет `setError('price', …)` и общий алерт. */
  onValidationError: (errors: MappedValidationErrors) => void;
}

/**
 * Мутация установки ставки.
 *
 * Успех не разбирает тело ответа — у операции нет схемы ответа (⑨),
 * источник истины после ставки — три инвалидированных запроса, а не то, что
 * вернул `POST`. `lists()` инвалидирует **все** варианты списка разом: цена и
 * место аукциона в рейтинге меняются независимо от того, какой набор фильтров
 * применён у пользователя прямо сейчас (0.66, отказ от optimistic updates).
 *
 * Ошибки 401/503/прочее уходят в тост — на форме их обрабатывать нечем, они
 * не про поле `price`. 422 — единственный код, который форма разбирает сама:
 * `onValidationError` получает уже разложенный результат
 * (`mapValidationErrors`), а не сырую ошибку.
 * @param options Идентификатор аукциона и обработчик ошибки валидации.
 * @returns Мутация `useMutation`: `mutate(price)` отправляет ставку.
 */
export const usePlaceBetMutation = ({
  auctionUuid,
  onValidationError,
}: UsePlaceBetMutationOptions) => {
  const queryClient = useQueryClient();
  const navigate = useNavigate({ from: '/auctions/$auctionUuid/bet' });
  const toast = useToast();

  return useMutation({
    mutationFn: (price: number) => postAuctionBet({ auctionUuid, price }),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: auctionKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.detail(auctionUuid) }),
        queryClient.invalidateQueries({ queryKey: auctionKeys.bets(auctionUuid) }),
      ]);
      toast.success('Ставка принята.');
      await navigate({ to: '/auctions/$auctionUuid', params: { auctionUuid } });
    },
    onError: (error: unknown) => {
      if (isValidationApiError(error)) {
        onValidationError(mapValidationErrors(error));

        return;
      }

      toast.error(error instanceof Error ? error.message : 'Не удалось отправить ставку.');
    },
  });
};
