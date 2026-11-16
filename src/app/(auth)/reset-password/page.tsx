"use client";

import { ArrowRight, CheckCircle2, Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";

import { AuthAlert, AuthField, AuthInput } from "@/components/auth/auth-fields";
import { AuthPasswordStrength } from "@/components/auth/auth-password-strength";
import { AuthShell } from "@/components/auth/auth-shell";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token. Request a new password reset.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        setError(payload?.message ?? "This reset link is invalid or has expired.");
        return;
      }

      setDone(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="lh-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Choose a new password
        </h1>
        <p className="text-sm text-lh-muted">
          Set a strong password to regain access to your Pagwave account.
        </p>
      </div>

      {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

      {done ? (
        <div className="space-y-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
            <div className="space-y-1 text-xs leading-relaxed text-emerald-200">
              <p className="text-sm font-semibold text-white">Password updated</p>
              <p>All previous sessions have been signed out for your security.</p>
            </div>
          </div>
          <Link
            href="/login"
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-lh-accent text-xs font-semibold text-white transition hover:bg-lh-accent/90"
          >
            Sign in with new password
            <ArrowRight className="size-3.5" />
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <AuthField label="New password" htmlFor="reset-password">
            <div className="relative">
              <AuthInput
                id="reset-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={pending}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-lh-muted transition-colors hover:text-white"
              >
                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
            <AuthPasswordStrength password={newPassword} />
          </AuthField>

          <AuthField label="Confirm password" htmlFor="reset-confirm">
            <AuthInput
              id="reset-confirm"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Repeat your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={pending}
            />
          </AuthField>

          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lh-accent px-4 text-sm font-semibold text-white shadow-lg shadow-lh-accent/25 transition hover:bg-lh-accent/90 disabled:pointer-events-none disabled:opacity-60"
          >
            {pending ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Updating password…
              </>
            ) : (
              <>
                Update password
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthShell mode="login">
      <Suspense fallback={<div className="h-[320px] animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
