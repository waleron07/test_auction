import { Stack } from '@mui/material';

import { type AssemblyVm, type AuctionPaymentVm } from '@/entities/auction';
import { FieldRow, SectionCard } from '@/shared/ui';

export interface AuctionPaymentSectionProps {
  payment: AuctionPaymentVm;
  assembly: AssemblyVm | null;
}

/** Условия оплаты и сборка — она есть не у каждого аукциона. */
export const AuctionPaymentSection = ({ payment, assembly }: AuctionPaymentSectionProps) => (
  <SectionCard title="Условия оплаты">
    <Stack spacing={1}>
      <FieldRow label="Форма оплаты" value={payment.form} />
      <FieldRow label="Условие" value={payment.condition} />
      <FieldRow label="Отсрочка платежа" value={payment.delay} />
      <FieldRow label="Предоплата" value={payment.prepay} />
      {assembly === null ? null : (
        <>
          <FieldRow label="Сборка" value={assembly.num} />
          <FieldRow label="Дата сборки" value={assembly.date} />
        </>
      )}
    </Stack>
  </SectionCard>
);
