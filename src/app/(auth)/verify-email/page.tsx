"use client";

import { ArrowRight, CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { AuthShell } from "@/components/auth/auth-shell";

type Status = "verifying" | "verified" | "error";

function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "error");
  const [message, setMessage] = useState<string>(
    token ? "Confirmando seu endereço de e-mail…" : "Este link de verificação está incompleto.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function verify() {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const payload = (await response.json().catch(() => null)) as { message?: string } | null;

        if (cancelled) return;

        if (response.ok) {
          setStatus("verified");
          setMessage("Seu endereço de e-mail foi verificado e sua conta está ativa.");
        } else {
          setStatus("error");
          setMessage(payload?.message ?? "Este link de verificação é inválido ou já foi utilizado.");
        }
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Erro de rede ao verificar seu e-mail. Tente novamente.");
        }
      }
    }

    void verify();
    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="lh-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Verificação de e-mail
        </h1>
        <p className="text-sm text-lh-muted">
          Mantendo sua conta protegida e pronta para movimentações.
        </p>
      </div>

      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
        <div className="flex items-start gap-3">
          {status === "verifying" ? (
            <Loader2 className="mt-0.5 size-5 shrink-0 animate-spin text-lh-accent" />
          ) : status === "verified" ? (
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-400" />
          ) : (
            <XCircle className="mt-0.5 size-5 shrink-0 text-rose-400" />
          )}
          <div className="space-y-1">
            <p className="text-sm font-semibold text-white">
              {status === "verifying"
                ? "Verificando…"
                : status === "verified"
                  ? "E-mail confirmado"
                  : "Falha na verificação"}
            </p>
            <p className="text-xs leading-relaxed text-lh-muted">{message}</p>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard"
        className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-lh-accent px-4 text-sm font-semibold text-white shadow-lg shadow-lh-accent/25 transition hover:bg-lh-accent/90"
      >
        Ir para o Painel
        <ArrowRight className="size-4" />
      </Link>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <AuthShell mode="login">
      <Suspense fallback={<div className="h-[260px] animate-pulse rounded-2xl bg-white/[0.03]" />}>
        <VerifyEmailStatus />
      </Suspense>
    </AuthShell>
  );
}
