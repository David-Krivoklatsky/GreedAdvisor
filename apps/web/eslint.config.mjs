import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

export default defineConfig([
  globalIgnores(['.next/**', 'node_modules/**', 'next-env.d.ts', 'generated/**']),
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@next/next/no-html-link-for-pages': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'error',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'no-console': 'warn',
    },
  },
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
  {
    // Full-page navigations that must not be client-side (oauth redirects, post-logout)
    files: ['lib/token-manager.ts', 'components/forms/oauth-buttons.tsx'],
    rules: {
      '@next/next/no-location-assign-relative-destination': 'off',
    },
  },
  {
    // Avatar renders base64 data URLs which next/image cannot optimize
    files: ['components/profile/sections/profile-section.tsx'],
    rules: {
      '@next/next/no-img-element': 'off',
    },
  },
]);