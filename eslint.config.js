// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { linterOptions: { reportUnusedDisableDirectives: false } },
  // Abaikan output & artefak build & serverless bundles
  { ignores: ['dist', '.netlify', 'coverage', 'node_modules', '**/netlify/**', 'public/tess/**'] },

  // Sumber aplikasi (React di browser)
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['scripts/**', '**/*.config.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Base recommended
      ...js.configs.recommended.rules,
      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // Quality tweaks umum proyek
      'no-console': 'off',
      'eqeqeq': ['error', 'smart'],
      'no-undef': 'off',

      // Refresh (Vite Fast Refresh)
      'react-refresh/only-export-components': 'off',
      'react-hooks/exhaustive-deps': 'off',

      // Unused vars → warning (boleh prefix _ utk sengaja tidak dipakai)
      'no-unused-vars': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-empty': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'no-empty': 'off',

      // Tidak perlu import React di JSX (React 17+)
      'react/react-in-jsx-scope': 'off',
    },
  },

  // Berkas test (Vitest + RTL) → aktifkan globals test
  {
    files: ['**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.vitest, // expect, vi, describe, it, etc.
      },
    },
    rules: {
      // Test kadang pakai expect(...).toBeTruthy() tanpa dipakai variabel
      'no-unused-expressions': 'off',
    },
  },

  // File Node (script build, config)
  {
    files: ['scripts/**/*.{js,cjs,mjs}', '**/*.{config,conf}.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      // Boleh pakai console di script
      'no-console': 'off',
    },
  },

  // Vitest / RTL tests (include __tests__ folders)
  {
    files: ['**/__tests__/**/*.{js,jsx}', '**/*.{test,spec}.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.vitest,
      },
    },
    rules: {
      'no-unused-expressions': 'off',
    },
  },
]
