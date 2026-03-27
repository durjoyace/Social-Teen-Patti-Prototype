import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useCallback } from 'react';
import type { TranslationKeys, TranslationKey } from './types';
import en from './locales/en';

// Re-export types for consumer convenience
export type { TranslationKeys, TranslationKey } from './types';
export type Locale = 'en' | 'hi' | 'gu' | 'mr' | 'te' | 'ta';

export interface LocaleInfo {
  code: Locale;
  name: string;
  nativeName: string;
  script: string;
}

export const AVAILABLE_LOCALES: LocaleInfo[] = [
  { code: 'en', name: 'English', nativeName: 'English', script: 'Latn' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', script: 'Deva' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', script: 'Gujr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', script: 'Deva' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', script: 'Telu' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', script: 'Taml' },
];

// ── Locale Loader ───────────────────────────────────────────────
// Lazy-load non-English locales to keep bundle small
const localeLoaders: Record<Locale, () => Promise<{ default: TranslationKeys }>> = {
  en: () => Promise.resolve({ default: en }),
  hi: () => import('./locales/hi'),
  gu: () => import('./locales/gu'),
  mr: () => import('./locales/mr'),
  te: () => import('./locales/te'),
  ta: () => import('./locales/ta'),
};

// Cache loaded translations in memory
const translationCache: Partial<Record<Locale, TranslationKeys>> = { en };

async function loadTranslations(locale: Locale): Promise<TranslationKeys> {
  if (translationCache[locale]) {
    return translationCache[locale]!;
  }
  const mod = await localeLoaders[locale]();
  translationCache[locale] = mod.default;
  return mod.default;
}

// ── Device Language Detection ───────────────────────────────────
function detectDeviceLocale(): Locale {
  try {
    const languages = navigator.languages ?? [navigator.language];
    for (const lang of languages) {
      const code = lang.split('-')[0].toLowerCase() as Locale;
      if (AVAILABLE_LOCALES.some((l) => l.code === code)) {
        return code;
      }
    }
  } catch {
    // SSR or navigator not available
  }
  return 'en';
}

// ── Interpolation ───────────────────────────────────────────────
function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => {
    const val = params[key];
    return val !== undefined ? String(val) : `{{${key}}}`;
  });
}

// ── Pluralization ───────────────────────────────────────────────
function getPluralSuffix(count: number): '_zero' | '_one' | '_other' {
  if (count === 0) return '_zero';
  if (count === 1) return '_one';
  return '_other';
}

// ── Zustand Store ───────────────────────────────────────────────
interface I18nState {
  locale: Locale;
  translations: TranslationKeys;
  isLoading: boolean;
  setLocale: (locale: Locale) => Promise<void>;
}

export const useI18nStore = create<I18nState>()(
  persist(
    (set, get) => ({
      locale: detectDeviceLocale(),
      translations: en, // fallback to English until async load completes
      isLoading: false,

      setLocale: async (locale: Locale) => {
        if (locale === get().locale && translationCache[locale]) return;
        set({ isLoading: true });
        try {
          const translations = await loadTranslations(locale);
          set({ locale, translations, isLoading: false });
        } catch {
          // Keep current locale on failure
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'teen-patti-i18n',
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);

// Load the persisted locale's translations on startup
const persistedLocale = useI18nStore.getState().locale;
if (persistedLocale !== 'en') {
  loadTranslations(persistedLocale).then((translations) => {
    useI18nStore.setState({ translations });
  });
}

// ── Translate Function ──────────────────────────────────────────
export function t(
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  const { translations } = useI18nStore.getState();

  // Handle pluralization: if `count` param is provided, try the plural key first
  if (params && 'count' in params) {
    const suffix = getPluralSuffix(params.count as number);
    const pluralKey = `${String(key)}${suffix}` as TranslationKey;
    if (pluralKey in translations) {
      return interpolate(translations[pluralKey], params);
    }
  }

  const value = translations[key];
  if (!value) {
    // Fallback to English
    const fallback = en[key];
    if (!fallback) {
      return String(key);
    }
    return interpolate(fallback, params);
  }

  return interpolate(value, params);
}

// ── React Hook ──────────────────────────────────────────────────
export function useTranslation() {
  const locale = useI18nStore((s) => s.locale);
  const translations = useI18nStore((s) => s.translations);
  const setLocale = useI18nStore((s) => s.setLocale);
  const isLoading = useI18nStore((s) => s.isLoading);

  const translate = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      // Handle pluralization
      if (params && 'count' in params) {
        const suffix = getPluralSuffix(params.count as number);
        const pluralKey = `${String(key)}${suffix}` as TranslationKey;
        if (pluralKey in translations) {
          return interpolate(translations[pluralKey], params);
        }
      }

      const value = translations[key];
      if (!value) {
        const fallback = en[key];
        return fallback ? interpolate(fallback, params) : String(key);
      }
      return interpolate(value, params);
    },
    [translations]
  );

  return {
    t: translate,
    locale,
    setLocale,
    isLoading,
    availableLocales: AVAILABLE_LOCALES,
  };
}
