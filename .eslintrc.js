module.exports = {
  env: {
    browser: true,
    es2021: true,
    webextensions: true,
    node: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  globals: {
    chrome: 'readonly',
    globalThis: 'writable'
  },
  rules: {
    // 代码风格
    'indent': ['error', 2],
    'linebreak-style': ['error', 'unix'],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // 最佳实践
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    'no-console': 'off',
    'no-debugger': 'warn',
    'no-alert': 'off', // 允许在扩展中使用confirm
    
    // ES6+
    'prefer-const': 'error',
    'no-var': 'error',
    'arrow-spacing': 'error',
    'template-curly-spacing': 'error',
    
    // 函数
    'func-style': ['error', 'declaration', { allowArrowFunctions: true }],
    'no-unused-expressions': 'error',
    
    // 对象和数组
    'object-curly-spacing': ['error', 'always'],
    'array-bracket-spacing': ['error', 'never'],
    
    // 注释
    'spaced-comment': ['error', 'always'],
    
    // 空格和换行
    'no-multiple-empty-lines': ['error', { max: 2, maxEOF: 1 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',
    
    // Chrome扩展特定
    'no-undef': 'error'
  },
  overrides: [
    {
      files: ['js/background.js'],
      globals: {
        importScripts: 'readonly'
      }
    },
    {
      files: ['js/content.js'],
      globals: {
        window: 'readonly',
        document: 'readonly'
      }
    },
    {
      files: ['js/popup.js'],
      globals: {
        window: 'readonly',
        document: 'readonly'
      }
    }
  ]
};