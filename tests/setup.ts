import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll } from 'vitest';

import { server } from '@/mocks/server';

import { installMatchMedia, resetViewportWidth } from './helpers/viewport';

// `onUnhandledRequest: 'error'` — намеренно строго: запрос, для которого нет
// обработчика, означает, что тест проверяет не то, что думает автор.
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
  // jsdom не реализует matchMedia: без заглушки весь адаптив уходит в
  // мобильную ветку, и половина интерфейса просто отсутствует в DOM.
  installMatchMedia();
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetViewportWidth();
});

afterAll(() => {
  server.close();
});
