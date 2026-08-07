// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const i18next = require('eslint-plugin-i18next');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'node_modules/*', '.expo/*', 'supabase/*'],
  },
  {
    // `i18n.use(...)` / `i18n.changeLanguage(...)` are the documented i18next API.
    // The import plugin mistakes them for a named-export mixup.
    files: ['src/i18n/index.ts'],
    rules: { 'import/no-named-as-default-member': 'off' },
  },
  {
    // The rule that makes "zero hardcoded user-facing strings" survive month three.
    // Every literal rendered to the user must come from src/i18n/locales/*.json.
    files: ['app/**/*.tsx', 'src/**/*.tsx'],
    plugins: { i18next },
    rules: {
      'i18next/no-literal-string': [
        'error',
        {
          markupOnly: true,
          onlyAttribute: ['label', 'title', 'placeholder', 'body'],
          // Style/layout props and test ids are not user-facing copy.
          ignoreAttribute: ['style', 'testID', 'name', 'variant', 'color', 'accessibilityRole'],
        },
      ],
    },
  },
]);
