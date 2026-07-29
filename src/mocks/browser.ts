import { setupWorker } from 'msw/browser';

import { handlers } from './handlers';

/** MSW в браузере (dev). */
export const worker = setupWorker(...handlers);
