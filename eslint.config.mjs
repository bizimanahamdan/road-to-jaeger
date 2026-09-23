import next from 'eslint-config-next';

/**
 * ESLint 9 flat config.
 *
 * `eslint-config-next@16` already ships a flat-config array (including the
 * `next/typescript` block), so it is spread in directly. Note that Next 16
 * removed `next lint` - linting runs through the ESLint CLI (`npm run lint`).
 */

/** Node globals for build/verification scripts (declared explicitly so we do */
/** not need a `globals` dependency).                                          */
const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  URL: 'readonly',
  __dirname: 'readonly',
  fetch: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
};

/** Service-worker globals for public/sw.js. */
const swGlobals = {
  self: 'readonly',
  caches: 'readonly',
  fetch: 'readonly',
  console: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  URL: 'readonly',
  Promise: 'readonly',
  setTimeout: 'readonly',
  crypto: 'readonly',
};

export default [
  {
    ignores: [
      '.next/**',
      'out/**',
      'node_modules/**',
      'android/**',
      'coverage/**',
      'next-env.d.ts',
      'supabase/seed/generated/**',
    ],
  },
  ...next,
  {
    files: ['scripts/**/*.mjs', '*.config.mjs'],
    languageOptions: { globals: nodeGlobals },
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: swGlobals, sourceType: 'script' },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      // Engineering correctness rules this codebase opts into.
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'prefer-const': 'error',
      'no-var': 'error',
      // Curriculum data files are large by design; that is content, not code.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['src/data/curriculum/**/*.ts'],
    rules: {
      // Content modules are intentionally long single-purpose data files.
      'no-console': 'off',
    },
  },
];
