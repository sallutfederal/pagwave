"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  DEFAULT_LOCALE,
  getMessages,
  getModuleMessages,
  isRtlLocale,
  type AppMessages,
  type Locale,
  type ModuleMessages,
} from "@/lib/i18n";

type LocaleContextValue = {
  locale: Locale;
  messages: AppMessages;
  modules: ModuleMessages;
  rtl: boolean;
  saving: boolean;
  setLocale: (next: Locale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: ReactNode;
}) {
  const router = useRouter();
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
  }, [locale]);

  const setLocale = useCallback(
    async (next: Locale) => {
      if (next === locale) return;
      setLocaleState(next);
      document.documentElement.lang = next;
      document.documentElement.dir = isRtlLocale(next) ? "rtl" : "ltr";
      setSaving(true);
      try {
        await fetch("/api/auth/locale", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ locale: next }),
        });
        router.refresh();
      } catch {
        // Keep selected UI state and let retry persist on next change.
      } finally {
        setSaving(false);
      }
    },
    [locale, router],
  );

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      messages: getMessages(locale),
      modules: getModuleMessages(locale),
      rtl: isRtlLocale(locale),
      saving,
      setLocale,
    }),
    [locale, saving, setLocale],
  );

  return <LocaleContext value={value}>{children}</LocaleContext>;
}

export function useI18n(): LocaleContextValue {
  const ctx = useContext(LocaleContext);
  if (ctx) return ctx;

  // Fallback for standalone previews if rendered outside LocaleProvider.
  return {
    locale: DEFAULT_LOCALE,
    messages: getMessages(DEFAULT_LOCALE),
    modules: getModuleMessages(DEFAULT_LOCALE),
    rtl: false,
    saving: false,
    setLocale: async () => {},
  };
}
