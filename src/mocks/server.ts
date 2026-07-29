import { setupServer } from 'msw/node';

import { handlers } from './handlers';

/** MSW в Vitest (интеграционные тесты). */
export const server = setupServer(...handlers);
