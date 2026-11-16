"use client";

import { ArrowLeft, ArrowRight, Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { useState, type FormEvent } from "react";

import { AuthAlert, AuthField, AuthInput } from "@/components/auth/auth-fields";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Enter your account e-mail address.");
      return;
    }

    setPending(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { message?: string } | null;
        setError(payload?.message ?? "Enter a valid e-mail address.");
        return;
      }

      setSent(true);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthShell mode="login">
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="lh-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Reset password
          </h1>
          <p className="text-sm text-lh-muted">
            Enter your e-mail and we&apos;ll send a link to choose a new password.
          </p>
        </div>

        {error ? <AuthAlert tone="error">{error}</AuthAlert> : null}

        {sent ? (
          <div className="space-y-5 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5">
            <div className="flex items-start gap-3">
              <MailCheck className="mt-0.5 size-5 shrink-0 text-emerald-400" />
              <div className="space-y-1 text-xs leading-relaxed text-emerald-200">
                <p className="text-sm font-semibold text-white">Check your inbox</p>
                <p>
                  If an account exists for <strong>{email}</strong>, a password reset link is on the way.
                </p>
              </div>
            </div>
            <Link
              href="/login"
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/[0.06] text-xs font-semibold text-white transition hover:bg-white/[0.1]"
            >
              <ArrowLeft className="size-3.5" />
              Back to Sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <AuthField label="E-mail address" htmlFor="forgot-email">
              <AuthInput
                id="forgot-email"
                type="email"
                autoComplete="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={pending}
                required
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
                  Sending link…
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-lh-muted">
          Remembered your password?{" "}
          <Link href="/login" className="font-semibold text-lh-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
