import { zodResolver } from '@hookform/resolvers/zod';
import { Alert, Button, Stack, TextField } from '@mui/material';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { type AuctionTradingVm } from '@/entities/auction';
import {
  type AuctionShowTradingPriceDto,
  type AuctionTypeDto,
  type BidMeasurementTypeDto,
} from '@/shared/api/dto';

import { createBetSchema, type BetFormValues } from '../lib/create-bet-schema.util';
import { usePlaceBetMutation } from '../model/use-place-bet-mutation.hook';

import { BetPriceHint } from './bet-price-hint.component';
import { BetStepButtons } from './bet-step-buttons.component';

export interface PlaceBetFormProps {
  auctionUuid: string;
  /** Готовые к рендеру подсказки о цене — та же VM, что и у детальной (Ф6). */
  trading: Pick<AuctionTradingVm, 'current' | 'available' | 'min' | 'max' | 'step'>;
  /** Сырые границы цены из detail DTO — источник правил Zod-схемы (⑦). */
  price: AuctionShowTradingPriceDto | undefined;
  aucType: AuctionTypeDto;
  bidMeasurementType: BidMeasurementTypeDto | null | undefined;
  /** Закрыть форму без отправки — тот же переход, что и у `Dialog.onClose`/крестика. */
  onClose: () => void;
}

/**
 * Форма установки ставки.
 *
 * `mode: 'onBlur'`: ошибка появляется после того, как пользователь закончил
 * с полем, а не на первое же нажатие клавиши — форма из одного поля не
 * должна ругаться раньше, чем в неё вообще что-то введено.
 *
 * Кнопки `±step` меняют то же самое RHF-состояние, что и текстовое поле:
 * `Controller` один на оба элемента, а не два независимых, — иначе значение
 * из кнопки и значение из поля были бы двумя источниками одного состояния.
 */
export const PlaceBetForm = ({
  auctionUuid,
  trading,
  price,
  aucType,
  bidMeasurementType,
  onClose,
}: PlaceBetFormProps) => {
  const [generalError, setGeneralError] = useState<string | null>(null);
  const schema = useMemo(
    () => createBetSchema(price, aucType, bidMeasurementType),
    [price, aucType, bidMeasurementType],
  );
  const step = price?.step ?? null;
  const safeStep = step !== null && step > 0 ? step : null;
  const defaultPrice = price?.available ?? price?.current ?? 0;

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<BetFormValues>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { price: defaultPrice },
  });

  const mutation = usePlaceBetMutation({
    auctionUuid,
    onValidationError: ({ fieldErrors, generalMessage }) => {
      if (fieldErrors.price !== undefined) {
        setError('price', { type: 'server', message: fieldErrors.price });
      }

      setGeneralError(generalMessage);
    },
  });

  const onSubmit = handleSubmit((values) => {
    setGeneralError(null);
    mutation.mutate(values.price);
  });

  return (
    <Stack
      component="form"
      onSubmit={(event) => {
        void onSubmit(event);
      }}
      noValidate
      spacing={2}
    >
      <BetPriceHint trading={trading} />

      <Controller
        control={control}
        name="price"
        render={({ field }) => (
          <Stack spacing={1}>
            <TextField
              label="Ваша цена"
              type="number"
              value={Number.isNaN(field.value) ? '' : field.value}
              onChange={(event) => {
                field.onChange((event.target as HTMLInputElement).valueAsNumber);
              }}
              onBlur={field.onBlur}
              error={errors.price !== undefined}
              helperText={errors.price?.message}
              slotProps={{ htmlInput: { 'aria-label': 'Цена ставки', min: 0 } }}
            />
            <BetStepButtons
              step={safeStep}
              value={Number.isNaN(field.value) ? null : field.value}
              onChange={field.onChange}
            />
          </Stack>
        )}
      />

      {generalError === null ? null : <Alert severity="error">{generalError}</Alert>}

      <Stack direction="row" spacing={1}>
        <Button
          type="button"
          variant="outlined"
          size="large"
          disabled={mutation.isPending}
          onClick={onClose}
        >
          Закрыть
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={mutation.isPending}
          sx={{ flexGrow: 1 }}
        >
          {mutation.isPending ? 'Отправка…' : 'Отправить ставку'}
        </Button>
      </Stack>
    </Stack>
  );
};
