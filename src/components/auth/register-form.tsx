"use client";

import { Building2, Eye, EyeOff, Loader2, Phone, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";

import {
  AUTH_COUNTRIES,
  AuthCountrySelect,
  type AuthCountryOption,
} from "@/components/auth/auth-country-select";
import {
  EARTH_DIVIDER_CLASS,
  EARTH_INPUT_CLASS,
  EARTH_PRIMARY_BUTTON_CLASS,
  EarthAuthCard,
  type AuthLocale,
} from "@/components/auth/earth-auth-shell";
import type { FlagCode } from "@/components/landing/country-flag";
import { cn } from "@/lib/utils";

const COPY = {
  pt: {
    title: "Criar conta",
    subtitle: "Bem-vindo à pagwave",
    personal: "Pessoal",
    business: "Empresa",
    phoneCaption: "Insira seu telefone (opcional) e dados",
    searchCountry: "Buscar país ou código...",
    firstNamePlaceholder: "Nome",
    lastNamePlaceholder: "Sobrenome",
    companyPlaceholder: "Razão social da empresa",
    emailPlaceholder: "nome@empresa.com",
    passwordPlaceholder: "Senha (mín. 8 caracteres)",
    submit: "Criar conta",
    submitting: "Criando conta...",
    hasAccount: "Já tem uma conta?",
    signIn: "Entrar",
    legalPrefix: "Ao criar uma conta, você concorda com os",
    terms: "Termos de serviço",
    legalJoin: "e a",
    privacy: "Política de privacidade",
    showPassword: "Mostrar senha",
    hidePassword: "Ocultar senha",
    homeAria: "Voltar para o início",
    strengthLabels: ["Fraca", "Média", "Boa", "Forte"] as const,
    rules: {
      length: "8+ caract.",
      upper: "Maiúscula",
      number: "Número",
      special: "Símbolo",
    },
    errors: {
      firstName: "Informe seu nome.",
      lastName: "Informe seu sobrenome.",
      email: "Informe um e-mail válido.",
      minLen: "A senha deve ter pelo menos 8 caracteres.",
      upper: "Inclua uma letra maiúscula na senha.",
      number: "Inclua um número na senha.",
      special: "Inclua um caractere especial na senha.",
      company: "Informe a razão social para conta empresarial.",
      generic: "Não foi possível criar sua conta. Tente novamente.",
      network: "Erro de rede ao criar sua conta. Tente novamente.",
    },
  },
  en: {
    title: "Create account",
    subtitle: "Welcome to pagwave",
    personal: "Personal",
    business: "Business",
    phoneCaption: "Enter your phone (optional) & details",
    searchCountry: "Search countries...",
    firstNamePlaceholder: "First name",
    lastNamePlaceholder: "Last name",
    companyPlaceholder: "Company legal name",
    emailPlaceholder: "name@company.com",
    passwordPlaceholder: "Password (min. 8 characters)",
    submit: "Create account",
    submitting: "Creating account...",
    hasAccount: "Already have an account?",
    signIn: "Sign in",
    legalPrefix: "By creating an account, you agree to our",
    terms: "Terms of service",
    legalJoin: "and",
    privacy: "Privacy policy",
    showPassword: "Show password",
    hidePassword: "Hide password",
    homeAria: "Back to home",
    strengthLabels: ["Weak", "Fair", "Good", "Strong"] as const,
    rules: {
      length: "8+ chars",
      upper: "Uppercase",
      number: "Number",
      special: "Symbol",
    },
    errors: {
      firstName: "First name is required.",
      lastName: "Last name is required.",
      email: "Enter a valid e-mail address.",
      minLen: "Password must be at least 8 characters.",
      upper: "Include an uppercase letter.",
      number: "Include a number.",
      special: "Include a special character.",
      company: "Company name is required for business accounts.",
      generic: "Could not create your account. Try again.",
      network: "Network error while creating your account. Please try again.",
    },
  },
} as const;

function buildSchema(err: (typeof COPY)["pt"]["errors"] | (typeof COPY)["en"]["errors"]) {
  return z
    .object({
      firstName: z.string().trim().min(1, err.firstName).max(100),
      lastName: z.string().trim().min(1, err.lastName).max(100),
      email: z.string().trim().email(err.email).max(255),
      password: z
        .string()
        .min(8, err.minLen)
        .max(128)
        .regex(/[A-Z]/, err.upper)
        .regex(/[0-9]/, err.number)
        .regex(/[^A-Za-z0-9]/, err.special),
      accountType: z.enum(["PERSONAL", "BUSINESS"]),
      companyName: z.string().trim().max(255).optional(),
    })
    .superRefine((data, ctx) => {
      if (data.accountType === "BUSINESS" && !data.companyName?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["companyName"],
          message: err.company,
        });
      }
    });
}

type FormState = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  accountType: "PERSONAL" | "BUSINESS";
  companyName?: string;
};
type FieldErrors = Partial<Record<keyof FormState, string>>;

export function RegisterForm() {
  const router = useRouter();

  const [locale, setLocale] = useState<AuthLocale>("pt");
  const [countryCode, setCountryCode] = useState<FlagCode>("BR");
  const [phone, setPhone] = useState("");
  const [form, setForm] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    accountType: "PERSONAL",
    companyName: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const t = COPY[locale];
  const activeCountry =
    AUTH_COUNTRIES.find((c) => c.code === countryCode) ?? AUTH_COUNTRIES[0];

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    setSubmitError(null);
  }

  function handleCountryChange(option: AuthCountryOption) {
    setCountryCode(option.code);
    setPhone("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const parsed = buildSchema(t.errors).safeParse(form);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormState | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...parsed.data,
          companyName:
            parsed.data.accountType === "BUSINESS" ? parsed.data.companyName : undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
      } | null;

      if (!response.ok) {
        setSubmitError(payload?.message ?? t.errors.generic);
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setSubmitError(t.errors.network);
    } finally {
      setPending(false);
    }
  }

  const pwd = form.password;
  const pwdChecks = [
    { ok: pwd.length >= 8, label: t.rules.length },
    { ok: /[A-Z]/.test(pwd), label: t.rules.upper },
    { ok: /[0-9]/.test(pwd), label: t.rules.number },
    { ok: /[^A-Za-z0-9]/.test(pwd), label: t.rules.special },
  ];
  const pwdScore = pwdChecks.filter((c) => c.ok).length;

  return (
    <EarthAuthCard
      locale={locale}
      onChangeLocale={(nextLocale) => {
        setLocale(nextLocale);
        setErrors({});
        setSubmitError(null);
      }}
      title={t.title}
      subtitle={t.subtitle}
      welcomeMode="subtitle"
      homeAriaLabel={t.homeAria}
    >
      {submitError ? (
        <div
          role="alert"
          className="mb-4 rounded-lg border border-rose-400/35 bg-rose-500/15 px-3 py-2 text-xs text-rose-100 backdrop-blur-md"
        >
          {submitError}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} noValidate className="space-y-3">
        {/* Account Type Switch */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { value: "PERSONAL", label: t.personal, icon: User },
              { value: "BUSINESS", label: t.business, icon: Building2 },
            ] as const
          ).map(({ value, label, icon: Icon }) => {
            const active = form.accountType === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                disabled={pending}
                onClick={() => update("accountType", value)}
                className={cn(
                  "flex h-9 items-center justify-center gap-1.5 rounded-lg border text-xs font-medium transition backdrop-blur-md",
                  active
                    ? "border-[#e7d599]/40 bg-white/[0.14] text-white shadow-sm"
                    : "border-white/[0.12] bg-white/[0.04] text-white/60 hover:border-white/25 hover:text-white",
                )}
              >
                <Icon className={cn("size-3.5", active && "text-[#e7d599]")} />
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 pt-0.5 text-xs text-white/70">
          <Phone className="size-3.5 text-[#e7d599]/85" />
          <span>{t.phoneCaption}</span>
        </div>

        {/* Country Flag + Dial selector matching Limited's /signup */}
        <div className="flex gap-2">
          <AuthCountrySelect
            value={countryCode}
            onChange={handleCountryChange}
            disabled={pending}
            searchPlaceholder={t.searchCountry}
          />
          <input
            id="reg-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={activeCountry.placeholder}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={pending}
            className={cn(EARTH_INPUT_CLASS, "flex-1")}
          />
        </div>

        {/* Name row */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <input
              id="reg-first-name"
              autoComplete="given-name"
              placeholder={t.firstNamePlaceholder}
              value={form.firstName}
              onChange={(e) => update("firstName", e.target.value)}
              disabled={pending}
              className={EARTH_INPUT_CLASS}
            />
            {errors.firstName ? (
              <p role="alert" className="mt-1 text-[10.5px] text-rose-300">
                {errors.firstName}
              </p>
            ) : null}
          </div>

          <div>
            <input
              id="reg-last-name"
              autoComplete="family-name"
              placeholder={t.lastNamePlaceholder}
              value={form.lastName}
              onChange={(e) => update("lastName", e.target.value)}
              disabled={pending}
              className={EARTH_INPUT_CLASS}
            />
            {errors.lastName ? (
              <p role="alert" className="mt-1 text-[10.5px] text-rose-300">
                {errors.lastName}
              </p>
            ) : null}
          </div>
        </div>

        {form.accountType === "BUSINESS" ? (
          <div>
            <input
              id="reg-company"
              placeholder={t.companyPlaceholder}
              value={form.companyName ?? ""}
              onChange={(e) => update("companyName", e.target.value)}
              disabled={pending}
              className={EARTH_INPUT_CLASS}
            />
            {errors.companyName ? (
              <p role="alert" className="mt-1 text-[10.5px] text-rose-300">
                {errors.companyName}
              </p>
            ) : null}
          </div>
        ) : null}

        <div>
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder={t.emailPlaceholder}
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            disabled={pending}
            className={EARTH_INPUT_CLASS}
          />
          {errors.email ? (
            <p role="alert" className="mt-1 text-[10.5px] text-rose-300">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="relative">
            <input
              id="reg-password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder={t.passwordPlaceholder}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              disabled={pending}
              className={cn(EARTH_INPUT_CLASS, "pr-10")}
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
          {errors.password ? (
            <p role="alert" className="mt-1 text-[10.5px] text-rose-300">
              {errors.password}
            </p>
          ) : null}

          {pwd.length > 0 ? (
            <div className="mt-2 space-y-1.5">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2, 3].map((idx) => (
                  <span
                    key={idx}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      idx < pwdScore
                        ? pwdScore === 4
                          ? "bg-[#e7d599]"
                          : pwdScore >= 2
                            ? "bg-white/65"
                            : "bg-rose-400/80"
                        : "bg-white/15",
                    )}
                  />
                ))}
                <span className="ml-1 text-[10px] font-medium text-white/65">
                  {pwdScore > 0 ? t.strengthLabels[pwdScore - 1] : t.strengthLabels[0]}
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px]">
                {pwdChecks.map((rule) => (
                  <span
                    key={rule.label}
                    className={cn(
                      "transition-colors",
                      rule.ok ? "text-[#e7d599]" : "text-white/40",
                    )}
                  >
                    {rule.ok ? "✓ " : "· "}
                    {rule.label}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <button type="submit" disabled={pending} className={cn(EARTH_PRIMARY_BUTTON_CLASS, "mt-1")}>
          {pending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              <span>{t.submitting}</span>
            </>
          ) : (
            <span>{t.submit}</span>
          )}
        </button>
      </form>

      <p className="mt-5 text-center text-sm text-white/60">
        {t.hasAccount}{" "}
        <Link
          href="/login"
          className="text-white/85 underline underline-offset-2 transition-colors hover:text-white"
        >
          {t.signIn}
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
