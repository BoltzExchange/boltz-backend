import pluginJs from '@eslint/js';
import imports from 'eslint-plugin-import';
import jestConfig from 'eslint-plugin-jest';
import node from 'eslint-plugin-n';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,ts}'] },
  {
    ignores: ['dist', 'lib/proto', 'contracts', 'node_modules'],
  },
  { languageOptions: { globals: globals.node } },

  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  imports.flatConfigs.errors,
  imports.flatConfigs.warnings,
  imports.flatConfigs.typescript,
  node.configs['flat/recommended'],
  jestConfig.configs['flat/recommended'],

  {
    rules: {
      'jest/expect-expect': 'off',
      'jest/no-conditional-expect': 'off',

      'n/no-missing-import': 'off',
      'n/no-extraneous-import': 'off',
      'n/no-unsupported-features/es-syntax': 'off',

      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/adjacent-overload-signatures': 'off',
      '@typescript-eslint/no-unsafe-declaration-merging': 'off',

      'import/no-unresolved': 'off',

      semi: 'error',
      'no-trailing-spaces': 'error',
      'no-unexpected-multiline': 'off',
      quotes: ['error', 'single', { avoidEscape: true }],
    },
  },
];
