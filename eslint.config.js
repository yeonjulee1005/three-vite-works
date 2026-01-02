import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      // Indent 설정
      indent: ['error', 2],
      
      // 세미콜론 없음
      semi: ['error', 'never'],
      
      // 문자열은 작은따옴표 사용
      quotes: ['error', 'single'],
      
      // TypeScript 관련 규칙
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**'],
  },
]

