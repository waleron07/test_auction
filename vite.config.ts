import { fileURLToPath, URL } from 'node:url';

import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
// defineConfig из vitest/config, а не из vite: только он знает про ключ `test`.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    // Плагин идёт перед react() — он трансформирует файлы маршрутов.
    // Путь сгенерированного дерева переопределён под kebab-case конвенцию
    // проекта (ARCHITECTURE §8): по умолчанию плагин пишет src/routeTree.gen.ts.
    tanstackRouter({
      target: 'react',
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/app/router/route-tree.gen.ts',
      autoCodeSplitting: true,
    }),
    react(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    projects: [
      {
        // Чистая логика: без DOM, гоняется в TDD-цикле постоянно (ARCHITECTURE 3.2).
        extends: true,
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/**/*.test.ts'],
        },
      },
      {
        // Проводка слоёв поверх MSW: jsdom + общий setup.
        extends: true,
        test: {
          name: 'integration',
          environment: 'jsdom',
          include: ['tests/**/*.test.tsx'],
          setupFiles: ['./tests/setup.ts'],
        },
      },
    ],
  },
});
