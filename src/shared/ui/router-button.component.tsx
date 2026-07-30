import { Button } from '@mui/material';
import { createLink } from '@tanstack/react-router';

/**
 * `Button`, привязанная к роутеру через `createLink` — рекомендованный
 * TanStack Router способ получить типобезопасные `to`/`params` на
 * произвольном компоненте (в отличие от `component={Link}`, где полиморфный
 * `component` MUI и generic-тип `Link` не выводят друг друга без явного
 * прокидывания через `createLink`).
 */
export const RouterButton = createLink(Button);
