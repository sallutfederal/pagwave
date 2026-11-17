"use client";

import { Eye, EyeOff, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";

import {
  EARTH_DIVIDER_CLASS,
  EARTH_INPUT_CLASS,
  EARTH_PRIMARY_BUTTON_CLASS,
  EarthAuthCard,
  type AuthLocale,
} from "@/components/auth/earth-auth-shell";
import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { safeNextPath } from "@/lib/session-constants";
import { cn } from "@/lib/utils";

const GLOBAL_CORRIDOR_FLAGS: readonly FlagCode[] = ["BR", "US", "EU", "MX", "GB"];

const COPY = {
  pt: {
    title: "Bem-vindo",
    subtitle: "Entre na sua conta para continuar",
    corridorBadge: "Acesso global multi-entidade",
    fieldCaption: "Insira seu e-mail e senha",
    emailPlaceholder: "nome@empresa.com",
    passwordPlaceholder: "Senha",
    twoFactorCaption: "Digite o código de 6 dígitos do seu aplicativo autenticador.",
    forgot: "Esqueceu a senha?",
    submit: "Entrar",
    submitting: "Entrando...",
    verifySubmit: "Verificar e entrar",
    useAnother: "Usar outra conta",
    noAccount: "Ainda não tem uma conta?",
    createAccount: "Criar conta",
    legalPrefix: "Ao entrar, você concorda com os",
    terms: "Termos de serviço",
    legalJoin: "e a",
    privacy: "Política de privacidade",
    emptyError: "Informe seu e-mail e senha.",
    invalid2fa: "Digite o código de 6 dígitos do seu autenticador.",
    invalidCreds: "E-mail ou senha inválidos.",
    serviceError: "Não foi possível conectar ao serviço de autenticação. Tente novamente.",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    homeAria: "Voltar para o início",
  },
  en: {
    title: "Welcome",
    subtitle: "Sign in to continue",
    corridorBadge: "Multi-entity global access",
    fieldCaption: "Enter your e-mail and password",
    emailPlaceholder: "name@company.com",
    passwordPlaceholder: "Password",
    twoFactorCaption: "Two-factor authentication is enabled. Enter your 6-digit code.",
    forgot: "Forgot password?",
    submit: "Sign in",
    submitting: "Signing in...",
    verifySubmit: "Verify & Sign in",
    useAnother: "Use a different account",
    noAccount: "Don't have an account yet?",
    createAccount: "Create account",
    legalPrefix: "By signing in, you agree to our",
    terms: "Terms of service",
    legalJoin: "and",
    privacy: "Privacy policy",
    emptyError: "Enter your e-mail and password.",
    invalid2fa: "Enter the 6-digit code from your authenticator app.",
    invalidCreds: "Invalid e-mail or password.",
    serviceError: "Unable to reach the authentication service. Please try again.",
    showPassword: "Show password",
    hidePassword: "Hide password",
    homeAria: "Back to home",
  },
} as const;

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = safeNextPath(searchParams.get("next"));

  const [locale, setLocale] = useState<AuthLocale>("pt");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [needs2FA, setNeeds2FA] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const t = COPY[locale];

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);

    if (!email.trim() || !password) {
      setError(t.emptyError);
      return;
    }

    if (needs2FA && !/^\d{6}$/.test(twoFactorCode.trim())) {
      setError(t.invalid2fa);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(needs2FA ? { twoFactorCode: twoFactorCode.trim() } : {}),
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; requiresTwoFactor?: boolean; error?: string; message?: string }
        | null;

      if (!response.ok) {
        if (response.status >= 502 || payload?.error === "BACKEND_UNREACHABLE") {
          setError(t.serviceError);
        } else {
          setError(payload?.message ?? t.invalidCreds);
        }
        return;
      }

      if (payload?.requiresTwoFactor) {
        setNeeds2FA(true);
        setNotice(t.twoFactorCaption);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError(t.serviceError);
    } finally {
      setPending(false);
    }
  }

  return (
    <EarthAuthCard
      locale={locale}
      onChangeLocale={setLocale}
      title={t.title}
      subtitle={t.subtitle}
      welcomeMode="title"
      homeAriaLabel={t.homeAria}
    >
      {/* Subtle multi-flag corridor pill matching Limited's global footprint */}
      <div className="mb-5 flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-white/75">
          <ShieldCheck className="size-3.5 text-[#e7d599]" />
          {t.corridorBadge}
        </span>
        <div className="flex items-center -space-x-1">
          {GLOBAL_CORRIDOR_FLAGS.map((code) => (
            <CountryFlag
              key={code}
              code={code}
              className="h-[13px] w-[17px] rounded-[2px] ring-1 ring-black/40"
            />
          ))}
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 backdrop-blur-md"
        >
          {error}
        </div>
      ) : null}

      {notice ? (
        <div
          role="status"
          className="mb-4 rounded-lg border border-[#e7d599]/25 bg-[#e7d599]/[0.09] px-3 py-2 text-xs text-white/90 backdrop-blur-md"
        >
          {notice}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        <div className="flex items-center gap-2 pb-0.5 text-xs text-white/70">
          <Mail className="size-3.5 text-[#e7d599]/85" />
          <span>{t.fieldCaption}</span>
        </div>

        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={pending || needs2FA}
          className={EARTH_INPUT_CLASS}
          required
        />

        <div className="relative">
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder={t.passwordPlaceholder}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending || needs2FA}
            className={cn(EARTH_INPUT_CLASS, "pr-10")}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? t.hidePassword : t.showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 text-white/50 transition-colors hover:text-white"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>

        {needs2FA ? (
          <div className="relative pt-1">
            <KeyRound className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 pt-0.5 text-[#e7d599]" />
            <input
              id="login-2fa"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              placeholder="000000"
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
              disabled={pending}
              className={cn(EARTH_INPUT_CLASS, "pl-10 font-mono tracking-[0.35em]")}
              autoFocus
            />
          </div>
        ) : null}

        <div className="flex justify-end pt-0.5">
          <Link
            href="/forgot-password"
            className="text-[11px] text-white/60 transition hover:text-white hover:underline"
          >
            {t.forgot}
          </Link>
        </div>

        <button type="submit" disabled={pending} className={EARTH_PRIMARY_BUTTON_CLASS}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{t.submitting}</span>
            </>
          ) : needs2FA ? (
            <span>{t.verifySubmit}</span>
          ) : (
            <span>{t.submit}</span>
          )}
        </button>

        {needs2FA ? (
          <button
            type="button"
            onClick={() => {
              setNeeds2FA(false);
              setTwoFactorCode("");
              setNotice(null);
            }}
            className="w-full pt-1 text-center text-xs text-white/60 transition hover:text-white"
          >
            {t.useAnother}
          </button>
        ) : null}
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        {t.noAccount}{" "}
        <Link
          href="/create"
          className="text-white/85 underline underline-offset-2 transition-colors hover:text-white"
        >
          {t.createAccount}
        </Link>
      </p>

      <div className={EARTH_DIVIDER_CLASS} />

      <p className="text-center text-xs leading-relaxed text-white/40">
        {t.legalPrefix}{" "}
        <Link href="/terms" className="text-white/60 underline underline-offset-2 hover:text-white/85">
          {t.terms}
        </Link>{" "}
        {t.legalJoin}{" "}
        <Link href="/privacy" className="text-white/60 underline underline-offset-2 hover:text-white/85">
          {t.privacy}
        </Link>
        .
      </p>
    </EarthAuthCard>
  );
}
