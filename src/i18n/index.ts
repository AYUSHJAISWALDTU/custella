import { getLocales } from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import hi from './locales/hi.json';

export const resources = {
  en: { translation: en },
  hi: { translation: hi },
} as const;

/** Locales with a complete translation file. Adding one here is the whole rollout. */
export const SUPPORTED_LOCALES = ['en', 'hi'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: SupportedLocale = 'en';

function isSupported(code: string | null | undefined): code is SupportedLocale {
  return !!code && (SUPPORTED_LOCALES as readonly string[]).includes(code);
}

/**
 * Device locale, if we have a translation for it. Used only as the initial guess for a
 * brand-new install — once a business exists, `businesses.locale` wins and is passed to
 * `setLocale()` at startup.
 */
export function detectDeviceLocale(): SupportedLocale {
  const code = getLocales()[0]?.languageCode;
  return isSupported(code) ? code : DEFAULT_LOCALE;
}

let initialized = false;

export function initI18n(locale: SupportedLocale = detectDeviceLocale()) {
  if (initialized) return i18n;
  initialized = true;

  i18n.use(initReactI18next).init({
    resources,
    lng: locale,
    fallbackLng: DEFAULT_LOCALE,
    // A missing Hindi key must fall back to English, never render the raw key path.
    returnEmptyString: false,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  return i18n;
}

export function setLocale(locale: SupportedLocale) {
  return i18n.changeLanguage(locale);
}

export default i18n;
