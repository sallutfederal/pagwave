import { MODULE_MESSAGES, type ModuleMessages } from "@/lib/i18n/modules";
import { MESSAGES_BY_LOCALE, type AppMessages } from "@/lib/i18n/translations";
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  SUPPORTED_LOCALES,
  getIntlLocale,
  getLocaleMeta,
  isRtlLocale,
  normalizeLocale,
  type Locale,
  type LocaleMeta,
} from "@/lib/i18n/types";

export {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  SUPPORTED_LOCALES,
  getIntlLocale,
  getLocaleMeta,
  isRtlLocale,
  normalizeLocale,
  type AppMessages,
  type Locale,
  type LocaleMeta,
  type ModuleMessages,
};

export function getMessages(locale: Locale): AppMessages {
  return MESSAGES_BY_LOCALE[locale] ?? MESSAGES_BY_LOCALE[DEFAULT_LOCALE];
}

export function getModuleMessages(locale: Locale): ModuleMessages {
  return MODULE_MESSAGES[locale] ?? MODULE_MESSAGES[DEFAULT_LOCALE];
}

export function translateCategory(category: string, locale: Locale): string {
  const dict = getMessages(locale).categories;
  return dict[category] ?? category;
}

export function translateStatus(
  status: keyof AppMessages["status"],
  locale: Locale,
): string {
  return getMessages(locale).status[status] ?? status;
}

export function formatLocaleDate(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

export function formatLocaleDateTime(iso: string, locale: Locale): string {
  return new Intl.DateTimeFormat(getIntlLocale(locale), {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}
