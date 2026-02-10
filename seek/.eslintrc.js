module.exports = {
  env: {
    browser: true,
    es2022: true,
    greasemonkey: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:security/recommended',
  ],
  plugins: ['security'],
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-non-literal-regexp': 'warn',
    'security/detect-unsafe-regex': 'error',
  },
  globals: {
    // Greasemonkey/Tampermonkey/Violentmonkey APIs
    GM_addStyle: 'readonly',
    GM_deleteValue: 'readonly',
    GM_getValue: 'readonly',
    GM_info: 'readonly',
    GM_listValues: 'readonly',
    GM_log: 'readonly',
    GM_openInTab: 'readonly',
    GM_registerMenuCommand: 'readonly',
    GM_setValue: 'readonly',
    GM_xmlhttpRequest: 'readonly',
    unsafeWindow: 'readonly',
  },
};
