import type en from './locales/en.json';

/**
 * Makes `t('home.addCustomer')` autocomplete and a typo'd key a TypeScript error.
 * English is the source of truth for the key set; other locales are checked against it
 * by `__tests__/i18n.test.ts`.
 */
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    resources: {
      translation: typeof en;
    };
  }
}
