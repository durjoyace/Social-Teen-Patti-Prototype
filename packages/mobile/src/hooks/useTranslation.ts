import { usePreferences } from "../stores/preferences";
import en from "../../../shared/src/i18n/locales/en";
import hi from "../../../shared/src/i18n/locales/hi";
import gu from "../../../shared/src/i18n/locales/gu";
import mr from "../../../shared/src/i18n/locales/mr";
import te from "../../../shared/src/i18n/locales/te";
import ta from "../../../shared/src/i18n/locales/ta";
import type { TranslationKey } from "../../../shared/src/i18n/types";
export function useTranslation() {
  const locale = usePreferences((s) => s.locale);
  const catalog = { en, hi, gu, mr, te, ta }[locale as "en"] || en;
  return { t: (key: TranslationKey) => catalog[key] || en[key] };
}
