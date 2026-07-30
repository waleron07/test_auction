import { type ValidationApiError } from '@/shared/api/api-error';

/** Результат разбора 422 для формы ставки. */
export interface MappedValidationErrors {
  /** Сообщение под полем `price` — единственное поле формы (⑧). */
  fieldErrors: { price?: string };
  /** Сообщения по незнакомым полям, объединённые для общего `Alert`; `null`, если их нет. */
  generalMessage: string | null;
}

/**
 * Раскладывает `ValidationApiError.errors[]` (⑯) на ошибку поля `price` и
 * общий алерт.
 *
 * `SetBetRequest` содержит одно поле, поэтому в норме ошибка ровно одна и
 * ровно по `price`. Но сервер присылает список произвольной длины, и ошибка
 * по незнакомому полю не должна пропадать молча — она уходит в
 * `generalMessage`, а не теряется при разборе.
 * @param error Ошибка 422 от `POST /auctions/{auctionUuid}/bets`.
 * @returns Сообщение под полем `price` и общий алерт по остальным ошибкам.
 */
export const mapValidationErrors = (error: ValidationApiError): MappedValidationErrors => {
  const fields = error.toFieldErrors();
  const { price, ...rest } = fields;
  const otherMessages = Object.values(rest);

  return {
    fieldErrors: price === undefined ? {} : { price },
    generalMessage: otherMessages.length > 0 ? otherMessages.join(' ') : null,
  };
};
