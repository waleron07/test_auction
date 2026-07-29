import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './app/app.component';
import { enableMocking } from './app/mocks/enable-mocking';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Не найден #root: проверьте index.html.');
}

// Моки поднимаются до первого рендера, иначе первые запросы уйдут в сеть
// и упадут — бэкенда у проекта нет (ARCHITECTURE 4.1).
await enableMocking();

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
