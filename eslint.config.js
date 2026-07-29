import js from '@eslint/js';
import pluginQuery from '@tanstack/eslint-plugin-query';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import { createTypeScriptImportResolver } from 'eslint-import-resolver-typescript';
import importX from 'eslint-plugin-import-x';
import jsdoc from 'eslint-plugin-jsdoc';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * Слои FSD в порядке убывания. Слой может импортировать только то,
 * что лежит ниже него; правило проверяется линтером, а не договорённостью
 * (ARCHITECTURE §2).
 */
const FSD_LAYERS = ['app', 'pages', 'widgets', 'features', 'entities', 'shared'];

/** Запрещает слою импорт из него самого и из всех вышележащих слоёв. */
const restrictUpwardImports = (layer) => {
  const forbidden = FSD_LAYERS.slice(0, FSD_LAYERS.indexOf(layer) + 1);

  return {
    files: [`src/${layer}/**`],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbidden.flatMap((upper) => [`@/${upper}/*`, `**/src/${upper}/*`]),
              message: `Слой "${layer}" не имеет права импортировать вышележащие слои. Направление импорта — только вниз (ARCHITECTURE §2).`,
            },
            {
              group: ['**/mocks/*', '@/mocks/*'],
              message:
                'src/mocks — тестовый дубль, ему нечего делать в бандле приложения. Общие данные (словарь городов) живут в shared/config (ARCHITECTURE 4.1).',
            },
          ],
        },
      ],
    },
  };
};

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'public/mockServiceWorker.js',
    // Сгенерированные файлы: правятся только через свой генератор.
    'src/shared/api/generated/**',
    'src/app/router/route-tree.gen.ts',
  ]),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      pluginQuery.configs['flat/recommended'],
      importX.flatConfigs.recommended,
      importX.flatConfigs.typescript,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      // resolver-next принимает готовый объект резолвера, а не запись
      // «имя → опции»: строковый интерфейс v4 резолвера больше не отдаёт
      // и падает с «invalid interface loaded as resolver».
      'import-x/resolver-next': [
        createTypeScriptImportResolver({
          project: ['./tsconfig.app.json', './tsconfig.node.json'],
          // Два проекта здесь осознанны: приложение и конфиги Node живут в
          // разных tsconfig, предупреждение резолвера про «single tsconfig» лишнее.
          noWarnOnMultipleProjects: true,
        }),
      ],
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      // Ненулевое утверждение — обход тотализации на границе маппера (㉜).
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'import-x/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [{ pattern: '@/**', group: 'internal' }],
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'import-x/no-cycle': 'error',
      // `throw redirect(...)` и `throw notFound(...)` — штатный поток управления
      // TanStack Router, а не бросок «чего попало»: redirect возвращает Response,
      // notFound — свой объект. Всё остальное по-прежнему обязано быть Error.
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            { from: 'lib', name: 'Response' },
            { from: 'package', package: '@tanstack/router-core', name: 'NotFoundError' },
          ],
        },
      ],
    },
  },

  // File-based маршруты: обязательный экспорт `Route` — не компонент, но
  // fast refresh на нём не ломается, плагин роутера обрабатывает эти файлы сам.
  {
    files: ['src/routes/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': ['error', { allowExportNames: ['Route'] }],
    },
  },

  // Сгенерированные типы не растекаются: импорт generated/** разрешён
  // только внутри shared/api (ARCHITECTURE §1, принцип 4).
  {
    files: ['src/**'],
    ignores: ['src/shared/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/generated/*', '@/shared/api/generated/*'],
              message:
                'Сгенерированные типы наружу не выходят. Используйте алиасы DTO из @/shared/api (dto.ts).',
            },
          ],
        },
      ],
    },
  },

  ...FSD_LAYERS.map(restrictUpwardImports),

  // JSDoc обязателен только на экспортируемых чистых функциях (PLAN 0.5).
  {
    files: ['src/**/lib/**/*.util.ts'],
    extends: [jsdoc.configs['flat/recommended-typescript-error']],
    rules: {
      'jsdoc/require-jsdoc': [
        'error',
        { publicOnly: true, require: { ArrowFunctionExpression: true, FunctionDeclaration: true } },
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': 'error',
      'jsdoc/require-description': 'error',
    },
  },

  // Тесты: моки и фикстуры живут по другим правилам.
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**', 'src/mocks/**'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      'no-restricted-imports': 'off',
    },
  },

  // Конфиги исполняются в Node.
  {
    files: ['*.config.{js,ts}', 'tests/**'],
    languageOptions: { globals: globals.node },
  },

  // Форматирование целиком отдано Prettier: стилевые правила ESLint гасятся.
  // Должно идти последним в цепочке.
  eslintConfigPrettier,
]);
