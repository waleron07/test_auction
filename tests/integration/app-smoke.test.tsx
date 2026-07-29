import { render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';

import { App } from '@/app/app.component';

/**
 * Smoke-тест каркаса: провайдеры собираются, роутер поднимается, корень
 * редиректит на /auctions. Ловит именно то, что не видит tsc — падение
 * на монтировании (порядок провайдеров, отсутствующий контекст).
 */
test('приложение монтируется и открывает список аукционов', async () => {
  render(<App />);

  expect(await screen.findByRole('heading', { name: 'Аукционы' })).toBeInTheDocument();
});
