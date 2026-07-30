import { Divider, Stack } from '@mui/material';

import { type ContactVm, type OrganizerVm } from '@/entities/auction';
import { ContactsList, OrganizerInfo } from '@/entities/organizer';
import { SectionCard } from '@/shared/ui';

export interface AuctionOrganizerSectionProps {
  organizer: OrganizerVm;
  contacts: ContactVm[];
}

/**
 * Секция организатора: сходятся сущности `auction` (тип из ViewModel detail) и
 * `organizer` (компоненты) — обе ниже виджета в иерархии FSD, поэтому
 * связывание именно здесь, а не в самих сущностях (они не видят друг друга).
 */
export const AuctionOrganizerSection = ({ organizer, contacts }: AuctionOrganizerSectionProps) => (
  <SectionCard title="Организатор">
    <Stack spacing={1.5}>
      <OrganizerInfo organizer={organizer} />
      <Divider />
      <ContactsList contacts={contacts} />
    </Stack>
  </SectionCard>
);
