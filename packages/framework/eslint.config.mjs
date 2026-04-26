import baseConfig from "../../eslint.config.mjs";
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  ...baseConfig,
  {
    files: ['src/**/*.test.ts'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        project: ['./tsconfig.test.json'],
        sourceType: 'module',
      },
    },
  },
]
