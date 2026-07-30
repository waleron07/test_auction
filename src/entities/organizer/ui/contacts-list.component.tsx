import { Stack, Typography } from '@mui/material';

import { EmptyState } from '@/shared/ui';

import { type ContactVm } from '../model/organizer.types';

export interface ContactsListProps {
  contacts: ContactVm[];
}

/**
 * Контакты организатора.
 *
 * `AuctionShowResponse.contacts` — обязательное поле, но допускает пустой
 * массив, если данных нет (комментарий схемы: «пустой массив, если данных
 * нет»). Пустой список — это не флаг «скрыто организатором» (тот флаг вообще
 * не существует для контактов организатора на detail, ㉖) и не ошибка, а
 * законное состояние контракта, поэтому у него отдельное пустое состояние, а
 * не «Скрыто организатором».
 */
export const ContactsList = ({ contacts }: ContactsListProps) => {
  if (contacts.length === 0) {
    return <EmptyState title="Контактов нет" message="Организатор не оставил контактов." />;
  }

  return (
    <Stack spacing={1.5}>
      {contacts.map((contact, index) => (
        // У Contact нет собственного идентификатора; массив приходит от
        // сервера целиком и не переупорядочивается на клиенте, поэтому
        // позиция — безопасный ключ.
        <Stack key={index} spacing={0.25}>
          <Typography variant="body2">{contact.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {contact.phone} · {contact.email}
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
};
