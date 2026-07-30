import { beforeEach, describe, expect, it } from 'vitest';

import { getAuction, postAuctionsList } from '@/entities/auction';
import { getAuctionBets, postAuctionBet } from '@/entities/bet';
import { ERROR_TRIGGER_UIDS, SEED_CASE_UIDS } from '@/mocks/seed';
import { resetStore } from '@/mocks/store';
import { isApiError, isValidationApiError } from '@/shared/api/api-error';

/**
 * Разбор ошибок контракта (⑯⑰) — против моков, а не против чтения кода.
 *
 * До фазы 3 этот слой был покрыт только типами: без работающих хендлеров
 * проверить, что 401 превращается в `ApiError` со `status`, а 422 — в
 * `ValidationApiError` с полями, было нечем. Ветки 401/404/422/503 в UI
 * опираются именно на это.
 */
describe('http: ошибки контракта разбираются в типизированные исключения', () => {
  beforeEach(() => {
    resetStore();
  });

  it('404: несуществующий аукцион даёт ApiError с кодом контракта', async () => {
    try {
      await getAuction('нет-такого-аукциона');
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isApiError(error)).toBe(true);

      if (!isApiError(error)) return;

      expect(error.status).toBe(404);
      expect(error.code).toBe('resource_not_found');
      expect(error.title).not.toBe('');
      // trace_id нужен для корреляции с логами на демонстрации.
      expect(error.traceId).not.toBeNull();
    }
  });

  it('401: аукцион-триггер отдаёт «сессия истекла», а не общую ошибку (⑰)', async () => {
    try {
      await getAuction(ERROR_TRIGGER_UIDS.unauthorized);
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isApiError(error) && error.status).toBe(401);
      expect(isApiError(error) && error.code).toBe('unauthorized');
    }
  });

  it('503: аукцион-триггер отдаёт «сервис недоступен» (⑰)', async () => {
    try {
      await getAuctionBets({ auctionUuid: ERROR_TRIGGER_UIDS.serviceUnavailable, all: true });
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isApiError(error) && error.status).toBe(503);
      expect(isApiError(error) && error.code).toBe('service_unavailable');
    }
  });

  it('422 на списке: ошибка привязана к полю per_page', async () => {
    try {
      await postAuctionsList({ page: 1, per_page: 5000 });
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isValidationApiError(error)).toBe(true);

      if (!isValidationApiError(error)) return;

      expect(error.status).toBe(422);
      expect(error.code).toBe('validation_failed');
      expect(error.toFieldErrors()).toHaveProperty('per_page');
    }
  });

  it('422 на ставке: цена вне правил аукциона возвращает ошибку по полю price', async () => {
    const orderUid = SEED_CASE_UIDS.biddableProlonged;

    try {
      // Ноль запрещён описанием `SetBetRequest.price`, но не схемой (⑧):
      // проверка обязана быть серверной, и вот она.
      await postAuctionBet({ auctionUuid: orderUid, price: 0 });
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isValidationApiError(error)).toBe(true);

      if (!isValidationApiError(error)) return;

      const fieldErrors = error.toFieldErrors();

      expect(fieldErrors).toHaveProperty('price');
      expect(fieldErrors.price).not.toBe('');
      expect(error.errors[0]?.code).toBe('min_value');
    }
  });

  it('422 на ставке: аукцион с can_set_bet: false ставку не принимает', async () => {
    const orderUid = SEED_CASE_UIDS.notBiddable;

    try {
      await postAuctionBet({ auctionUuid: orderUid, price: 35_000 });
      expect.unreachable('Запрос обязан был упасть.');
    } catch (error) {
      expect(isValidationApiError(error)).toBe(true);

      if (!isValidationApiError(error)) return;

      expect(error.errors[0]?.code).toBe('bet_not_allowed');
    }
  });
});
