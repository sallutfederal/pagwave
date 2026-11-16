"use client";

import { Check, Globe } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

import { LogoMark } from "@/components/brand/logo";
import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { RotatingEarth } from "@/components/auth/rotating-earth";
import { cn } from "@/lib/utils";

export type AuthLocale = "pt" | "en";

export const EARTH_INPUT_CLASS =
  "h-10 w-full rounded-lg border border-white/20 bg-white/[0.05] px-3 text-[14px] text-white placeholder:text-white/35 backdrop-blur-md outline-none transition focus:border-white/40 focus:bg-white/[0.08] focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50";

export const EARTH_PRIMARY_BUTTON_CLASS =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 text-sm font-medium text-white shadow-lg shadow-black/25 backdrop-blur-md transition hover:bg-white/20 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50";

export const EARTH_DIVIDER_CLASS =
  "my-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent";

const WELCOME_WORDS: readonly { text: string; lang: string }[] = [
  { text: "Bem-vindo", lang: "pt" },
  { text: "Welcome", lang: "en" },
  { text: "欢迎", lang: "zh" },
  { text: "Bienvenido", lang: "es" },
  { text: "Bienvenue", lang: "fr" },
  { text: "Willkommen", lang: "de" },
  { text: "ようこそ", lang: "ja" },
  { text: "Benvenuto", lang: "it" },
];

const LOCALE_OPTIONS: readonly { code: AuthLocale; label: string; flag: FlagCode }[] = [
  { code: "pt", label: "Português", flag: "BR" },
  { code: "en", label: "English", flag: "US" },
];

function WelcomeWord({ locale }: { locale: AuthLocale }) {
  const reduced = useReducedMotion();
  const [index, setIndex] = useState(locale === "pt" ? 0 : 1);

  useEffect(() => {
    if (reduced) return;
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WELCOME_WORDS.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [reduced]);

  const current = reduced ? WELCOME_WORDS[locale === "pt" ? 0 : 1] : WELCOME_WORDS[index];

  return (
    <span className="inline-flex h-[1.35em] items-center justify-center align-middle">
      <AnimatePresence mode="wait">
        <motion.span
          key={current.lang + current.text}
          lang={current.lang}
          initial={reduced ? undefined : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduced ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {current.text}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

/** Full-viewport atmospheric sky + rotating monochrome Earth backdrop in Telegraf. */
export function EarthAuthBackdrop({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-dvh w-full items-center justify-center overflow-x-hidden bg-[#8e8f8b] px-4 py-8 text-white selection:bg-[#e7d599]/30 selection:text-white"
      style={{ fontFamily: "var(--font-telegraf), var(--font-jakarta), sans-serif" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(110% 72% at 50% 10%, #b3b4b0 0%, #9b9c98 36%, #676865 66%, #1f2021 88%, #0a0b0d 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(231, 213, 153, 0.1), transparent 52%)",
        }}
      />

      <RotatingEarth />

      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[2] bg-gradient-to-b from-transparent via-black/20 to-black/40"
      />

      <div className="relative z-10 flex w-full items-center justify-center">{children}</div>
    </main>
  );
}

interface EarthAuthCardProps {
  locale: AuthLocale;
  onChangeLocale: (locale: AuthLocale) => void;
  title: string;
  subtitle: string;
  welcomeMode?: "title" | "subtitle";
  homeAriaLabel: string;
  maxWidthClassName?: string;
  children: ReactNode;
}

/** Frosted translucent glass card matching the Limited web.limitedapp.com auth aesthetic. */
export function EarthAuthCard({
  locale,
  onChangeLocale,
  title,
  subtitle,
  welcomeMode,
  homeAriaLabel,
  maxWidthClassName = "max-w-md",
  children,
}: EarthAuthCardProps) {
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!langMenuOpen) return;
    function onOutsideClick(event: MouseEvent) {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target as Node)) {
        setLangMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [langMenuOpen]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className={cn("relative w-full", maxWidthClassName)}
    >
      {/* Subtle outer halo matching Limited's m-auth-card */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-white/10 to-white/5 opacity-50 blur-lg"
      />

      <div
        className="relative w-full overflow-visible rounded-2xl border border-white/10"
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          backdropFilter: "blur(48px) saturate(1.5)",
          WebkitBackdropFilter: "blur(48px) saturate(1.5)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        }}
      >
        {/* Top Bar */}
        <div
          className="relative z-30 flex items-center justify-between rounded-t-2xl px-6 py-4 sm:px-8"
          style={{
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(255, 255, 255, 0.05)",
          }}
        >
          <div className="w-16" aria-hidden="true" />

          <Link
            href="/"
            aria-label={homeAriaLabel}
            className="inline-flex items-center gap-2 transition-opacity hover:opacity-85"
          >
            <span
              className="inline-flex"
              style={
                {
                  "--logo-from": "#ffffff",
                  "--logo-to": "#e4e4e7",
                  "--logo-edge": "#ffffff",
                  "--logo-n-from": "#111214",
                  "--logo-n-to": "#27272a",
                } as CSSProperties
              }
            >
              <LogoMark size={20} radius={22} />
            </span>
            <span className="text-[13px] font-semibold tracking-[0.18em] uppercase text-white/95">
              pagwave
            </span>
          </Link>

          <div ref={langMenuRef} className="relative flex w-16 justify-end">
            <button
              type="button"
              onClick={() => setLangMenuOpen((prev) => !prev)}
              aria-expanded={langMenuOpen}
              aria-label="Switch language"
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/80 transition",
                langMenuOpen ? "bg-white/10 text-white" : "hover:bg-white/[0.06] hover:text-white",
              )}
            >
              <Globe className="size-3.5 opacity-85" />
              <span>{locale.toUpperCase()}</span>
            </button>

            {langMenuOpen ? (
              <div className="absolute top-full right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-white/12 bg-[#141414]/95 py-1 shadow-2xl backdrop-blur-2xl">
                {LOCALE_OPTIONS.map((item) => {
                  const active = item.code === locale;
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        onChangeLocale(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left text-xs transition-colors",
                        active
                          ? "bg-[#e7d599]/15 text-[#e7d599]"
                          : "text-white/85 hover:bg-white/[0.08]",
                      )}
                    >
                      <span className="flex items-center gap-2.5">
                        <CountryFlag code={item.flag} className="h-[13px] w-[18px] rounded-[2px]" />
                        <span className="font-medium">{item.label}</span>
                      </span>
                      {active ? <Check className="size-3.5" /> : null}
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>

        {/* Greeting + Card Body */}
        <div className="px-6 pt-7 pb-6 sm:px-8 sm:pb-7">
          <div className="mb-6 text-center">
            <h1 className="text-[28px] font-light tracking-[-0.02em] text-white sm:text-[30px]">
              {welcomeMode === "title" ? <WelcomeWord key={locale} locale={locale} /> : title}
            </h1>
            <p className="mt-1 text-sm font-normal text-white/60">
              {welcomeMode === "subtitle" ? <WelcomeWord key={locale} locale={locale} /> : subtitle}
            </p>
          </div>

          {children}
        </div>
      </div>
    </motion.div>
  );
}
