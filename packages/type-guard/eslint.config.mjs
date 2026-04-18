import baseConfig from "../../eslint.config.mjs";

export default [
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: ['./src/runtime/tsconfig.json', './src/transformer/tsconfig.json'],
      },
    },
  },
]
