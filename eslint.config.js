// eslint.config.js
import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  // Abaikan output & artefak build
  { ignores: ['dist', '.netlify', 'coverage', 'node_modules'] },

  // Sumber aplikasi (React di browser)
  {
    files: ['**/*.{js,jsx}'],
    ignores: ['scripts/**', '**/*.config.{js,cjs,mjs}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
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
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'eqeqeq': ['error', 'smart'],

      // Refresh (Vite Fast Refresh)
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Unused vars → warning (boleh prefix _ utk sengaja tidak dipakai)
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

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
]
