import js from '@eslint/js';
import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import nextTypescript from 'eslint-config-next/typescript';

// eslint-config-next v16 ships flat configs only (as ESM subpath exports).
// Importing the flat arrays directly avoids the FlatCompat circular-JSON
// crash seen with `extends: 'next/core-web-vitals'`.
const nextCore = Array.isArray(nextCoreWebVitals)
  ? nextCoreWebVitals
  : (nextCoreWebVitals.default ?? []);

const nextTs = Array.isArray(nextTypescript)
  ? nextTypescript
  : (nextTypescript.default ?? []);

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'out/**', 'coverage/**', 'next-env.d.ts'],
  },
  js.configs.recommended,
  ...nextCore,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'smart'],
    },
  },
  {
    // Build/verification scripts report their result on stdout by design.
    files: ['tools/**/*.mjs'],
    rules: {
      'no-console': 'off',
    },
  },
];

export default config;

