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
      // The provider intentionally syncs orchestration refs from state and the
      // shell derives transient gates from phase changes; both are idiomatic
      // here and pre-existing patterns, so keep them advisory.
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
];

export default config;

