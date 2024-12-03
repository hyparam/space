import js from '@eslint/js'
import react from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// Copy from https://github.com/hyparam/hyperparam-cli/blob/87b516bbcaadc0ffacb9914c4ba7a8d827e65469/shared.eslint.config.js
const sharedJsRules = {
  'arrow-spacing': 'error',
  camelcase: 'off',
  'comma-spacing': 'error',
  'comma-dangle': ['error', 'always-multiline'],
  'eol-last': 'error',
  eqeqeq: 'error',
  'func-style': ['error', 'declaration'],
  indent: ['error', 2],
  'no-constant-condition': 'off',
  'no-extra-parens': 'error',
  'no-multi-spaces': 'error',
  'no-trailing-spaces': 'error',
  'no-unused-vars': 'off',
  'no-useless-concat': 'error',
  'no-useless-rename': 'error',
  'no-useless-return': 'error',
  'no-var': 'error',
  'object-curly-spacing': ['error', 'always'],
  'prefer-const': 'warn',
  'prefer-destructuring': ['warn', {
    object: true,
    array: false,
  }],
  'prefer-promise-reject-errors': 'error',
  quotes: ['error', 'single'],
  'require-await': 'warn',
  semi: ['error', 'never'],

  'sort-imports': ['error', {
    ignoreDeclarationSort: true,
    ignoreMemberSort: false,
    memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
  }],

  'space-infix-ops': 'error',
}
const sharedTsRules = {
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/no-unused-vars': 'warn',
}

export default tseslint.config(
  { ignores: ['dist', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked, ...tseslint.configs.stylisticTypeChecked],
    // Set the react version
    settings: { react: { version: '18.3' } },
    files: ['{test,src}/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended.rules,
      ...sharedJsRules,
      ...sharedTsRules,
    },
  },
)
