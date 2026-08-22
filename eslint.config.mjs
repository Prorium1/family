import { defineConfig, globalIgnores } from 'eslint/config'
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'
import prettier from 'eslint-config-prettier'

const eslintConfig = defineConfig([
  globalIgnores([
    '.next/**',
    'node_modules/**',
    'playwright-report/**',
    'test-results/**',
    'coverage/**',
    'next-env.d.ts',
    'public/sw.js',
  ]),
  ...nextCoreWebVitals,
  ...nextTypescript,
  prettier,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/server/repositories/*',
                '!@/server/repositories/index',
                '!@/server/repositories/repository-types',
              ],
              message:
                'Import repositories through @/server/repositories so the demo/Supabase driver stays swappable.',
            },
          ],
        },
      ],
    },
  },
  {
    // Tests and the demo-only API may reach into the demo store directly.
    files: ['src/tests/**', 'src/app/api/demo/**'],
    rules: { 'no-restricted-imports': 'off' },
  },
])

export default eslintConfig
