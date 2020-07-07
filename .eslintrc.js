module.exports = {
  'env': {
    'node': true
  },
  rules: {
    'jest/expect-expect': 'off',
    'node/no-missing-import': 'off',
    'node/no-extraneous-import': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    'node/no-unsupported-features/es-syntax': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/adjacent-overload-signatures': 'off',

    'no-trailing-spaces': 'error',
    'quotes': ['error', 'single', { 'avoidEscape': true }],
  },
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: [
    'dist/',
    'lib/proto/',
    'node_modules/',
  ],
  plugins: [
    'jest',
    'eslint-plugin-import',
    'eslint-plugin-node',
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:jest/recommended',
    'plugin:node/recommended',
    'plugin:import/typescript',
    'plugin:@typescript-eslint/recommended',
  ],
};

