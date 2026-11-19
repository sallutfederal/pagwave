export const SUPPORTED_LOCALES = ["pt", "en", "es", "ar", "fr", "de"] as const;

export type Locale = (typeof SUPPORTED_LOCALES)[number];

export type LocaleMeta = {
  code: Locale;
  short: string;
  label: string;
  intl: string;
  rtl: boolean;
};

export const LOCALE_OPTIONS: LocaleMeta[] = [
  { code: "pt", short: "PT", label: "Português (BR)", intl: "pt-BR", rtl: false },
  { code: "en", short: "EN", label: "English", intl: "en-US", rtl: false },
  { code: "es", short: "ES", label: "Español", intl: "es-ES", rtl: false },
  { code: "ar", short: "AR", label: "العربية", intl: "ar-SA", rtl: true },
  { code: "fr", short: "FR", label: "Français", intl: "fr-FR", rtl: false },
  { code: "de", short: "DE", label: "Deutsch", intl: "de-DE", rtl: false },
];

export const DEFAULT_LOCALE: Locale = "pt";

export function normalizeLocale(value: unknown): Locale {
  if (typeof value === "string") {
    const clean = value.trim().toLowerCase().slice(0, 2);
    if ((SUPPORTED_LOCALES as readonly string[]).includes(clean)) {
      return clean as Locale;
    }
  }
  return DEFAULT_LOCALE;
}

export function getLocaleMeta(locale: Locale): LocaleMeta {
  return LOCALE_OPTIONS.find((item) => item.code === locale) ?? LOCALE_OPTIONS[0];
}

export function isRtlLocale(locale: Locale): boolean {
  return getLocaleMeta(locale).rtl;
}

export function getIntlLocale(locale: Locale): string {
  return getLocaleMeta(locale).intl;
}
