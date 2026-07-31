import { Chip, Stack } from '@mui/material';

import { type AuctionCargoDetailVm } from '@/entities/auction';
import { FieldRow, SectionCard } from '@/shared/ui';

export interface AuctionCargoSectionProps {
  cargo: AuctionCargoDetailVm;
}

/**
 * Груз и требования к транспортному средству.
 *
 * `cargo.price` уже содержит либо отформатированную сумму, либо «Скрыто
 * организатором» — секция просто выводит строку, не заглядывая в
 * `no_view_cargo_price` заново.
 */
export const AuctionCargoSection = ({ cargo }: AuctionCargoSectionProps) => (
  <SectionCard title="Груз">
    <Stack spacing={1}>
      <FieldRow label="Наименование" value={cargo.name} />
      <FieldRow label="Цена груза" value={cargo.price} />
      <FieldRow label="Тип кузова" value={cargo.bodyType} />
      <FieldRow label="Количество ТС" value={cargo.truckCount} />
      <FieldRow label="Расстояние" value={cargo.distance} />

      {cargo.loadingTypes.length === 0 ? null : (
        <FieldRow
          label="Загрузка"
          value={
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              {cargo.loadingTypes.map((label) => (
                <Chip key={label} size="small" label={label} />
              ))}
            </Stack>
          }
        />
      )}

      {cargo.docs.length === 0 ? null : (
        <FieldRow
          label="Документы"
          value={
            <Stack
              direction="row"
              spacing={0.5}
              useFlexGap
              sx={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}
            >
              {cargo.docs.map((label) => (
                <Chip key={label} size="small" variant="outlined" label={label} />
              ))}
            </Stack>
          }
        />
      )}

      {cargo.car === null ? null : (
        <>
          <FieldRow label="Требуемый транспорт" value={cargo.car.type} />
          <FieldRow label="Грузоподъёмность" value={cargo.car.weight} />
          <FieldRow label="Вместимость" value={cargo.car.volume} />
          <FieldRow label="Габариты (Д × Ш × В)" value={cargo.car.dimensions} />
        </>
      )}
    </Stack>
  </SectionCard>
);
