"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Activity,
  KeyRound,
  Lock,
  RefreshCw,
  ShieldAlert,
  Users,
  Webhook,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import {
  XPAG_CURRENCIES,
  formatCurrencyAmount,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type OverviewPayload = {
  ok: boolean;
  isSandbox: boolean;
  xpagBaseUrl: string;
  xpagClientIdMasked: string;
  xpagBalance: {
    balances?: Record<string, { available: number; blocked: number }>;
    blocked_currencies?: string[];
  } | null;
  overview: {
    totalUsers: number;
    activeApiKeys: number;
    totalApiRequests: number;
    totalBeneficiaries: number;
    totalActivities: number;
    cashinCount: number;
    cashoutCount: number;
    conversionCount: number;
    medActiveCount: number;
    webhookCount: number;
    volumeByCurrency: Record<
      string,
      { cashin: number; cashout: number; count: number }
    >;
    recentActivities: Array<{
      id: string;
      userId: string;
      kind: string;
      currency: string;
      amount?: number;
      status: string;
      createdAt: string;
    }>;
  };
};

export function AdminOverviewView() {
  const [data, setData] = useState<OverviewPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/overview", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | (OverviewPayload & { message?: string })
        | null;
      if (cancelled) return;
      if (res.ok && json?.ok) {
        setData(json);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar painel administrativo.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const ov = data?.overview;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>Upstream XPag:</span>
          <code className="text-foreground font-mono">{data?.xpagBaseUrl || "—"}</code>
          {data?.isSandbox ? (
            <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-medium text-amber-300">
              Sandbox ({data.xpagClientIdMasked})
            </span>
          ) : data ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-300">
              Produção ({data.xpagClientIdMasked})
            </span>
          ) : null}
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setRefreshTick((t) => t + 1);
          }}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar métricas
        </Button>
      </div>

      {errorMsg ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {errorMsg}
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Contas & Chaves Ativas</span>
            <Users className="size-4 text-accent" />
          </div>
          <p className="text-foreground font-mono text-2xl font-semibold">
            {ov?.totalUsers ?? "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            {ov?.activeApiKeys ?? 0} credenciais Pagwave · {ov?.totalBeneficiaries ?? 0} destinos salvos
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Movimentações Globais</span>
            <Activity className="size-4 text-emerald-400" />
          </div>
          <p className="text-foreground font-mono text-2xl font-semibold">
            {ov?.totalActivities ?? "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            {ov?.cashinCount ?? 0} Cash-in · {ov?.cashoutCount ?? 0} Cash-out · {ov?.conversionCount ?? 0} FX
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Requisições API (/api/v1)</span>
            <KeyRound className="size-4 text-sky-400" />
          </div>
          <p className="text-foreground font-mono text-2xl font-semibold">
            {ov?.totalApiRequests ?? "—"}
          </p>
          <p className="text-muted-foreground text-xs">
            {ov?.webhookCount ?? 0} eventos webhook validados
          </p>
        </Card>

        <Card className="space-y-2 p-5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Disputas MED Ativas</span>
            <ShieldAlert
              className={cn(
                "size-4",
                (ov?.medActiveCount ?? 0) > 0 ? "text-amber-300" : "text-muted-foreground",
              )}
            />
          </div>
          <p className="text-foreground font-mono text-2xl font-semibold">
            {ov?.medActiveCount ?? 0}
          </p>
          <Link href="/admin/transactions" className="text-accent inline-block text-xs hover:underline">
            Gerenciar transações e MED →
          </Link>
        </Card>
      </div>

      {/* Live Master XPag Balances across all 10 currencies */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Saldos da Conta Mestre XPag por Moeda
            </h3>
            <p className="text-muted-foreground text-xs">
              Liquidez consolidada disponível vs. bloqueios MED e volume processado na plataforma.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {XPAG_CURRENCIES.map((code) => {
            const bal = data?.xpagBalance?.balances?.[code];
            const vol = ov?.volumeByCurrency?.[code];
            return (
              <div
                key={code}
                className="border-line bg-surface-subtle space-y-2.5 rounded-2xl border p-3.5"
              >
                <CurrencyBadge currency={code} showNetwork={false} />
                <div>
                  <p className="text-muted-foreground text-[10px] uppercase">Saldo disponível</p>
                  <p className="text-foreground truncate font-mono text-sm font-semibold">
                    {bal ? formatCurrencyAmount(bal.available ?? 0, code) : "—"}
                  </p>
                  {(bal?.blocked ?? 0) > 0 ? (
                    <p className="inline-flex items-center gap-1 text-[11px] text-amber-300">
                      <Lock className="size-3" />
                      {formatCurrencyAmount(bal!.blocked, code)}
                    </p>
                  ) : null}
                </div>
                <p className="text-muted-foreground border-t border-white/5 pt-2 text-[11px]">
                  Ops registradas: <span className="text-foreground font-mono">{vol?.count ?? 0}</span>
                </p>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Recent system events */}
      <div className="grid gap-6 xl:grid-cols-12">
        <Card className="space-y-3 p-5 xl:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-sm font-semibold">
              Últimas transações da plataforma
            </h3>
            <Link href="/admin/transactions" className="text-accent text-xs hover:underline">
              Ver todas →
            </Link>
          </div>
          {!ov || ov.recentActivities.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Nenhuma operação registrada ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {ov.recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="border-line bg-surface-subtle flex items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-mono font-semibold">
                      [{act.kind.toUpperCase()}] {act.currency} · {act.status}
                    </p>
                    <p className="text-muted-foreground truncate text-[11px]">
                      Usuário: {act.userId}
                    </p>
                  </div>
                  <div className="text-right font-mono">
                    <p className="text-foreground">
                      {typeof act.amount === "number" ? act.amount : "Valor aberto"}
                    </p>
                    <p className="text-muted-foreground text-[10px]">
                      {new Date(act.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-5 xl:col-span-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Webhook className="text-accent size-4" />
              <h3 className="text-foreground text-sm font-semibold">Atalhos Administrativos</h3>
            </div>
          </div>
          <div className="grid gap-2.5">
            <Link
              href="/admin/users"
              className="border-line bg-surface-subtle hover:border-accent/40 rounded-xl border p-3.5 text-xs transition-colors"
            >
              <p className="text-foreground font-semibold">Gerenciar Usuários & KYC</p>
              <p className="text-muted-foreground mt-0.5">
                Aprovar/reprovar KYC, ajustar nível e suspender contas com comportamento suspeito.
              </p>
            </Link>
            <Link
              href="/admin/integrations"
              className="border-line bg-surface-subtle hover:border-accent/40 rounded-xl border p-3.5 text-xs transition-colors"
            >
              <p className="text-foreground font-semibold">Auditoria de Chaves API & Webhooks</p>
              <p className="text-muted-foreground mt-0.5">
                Revogar credenciais de API em emergência e acompanhar entregas HMAC.
              </p>
            </Link>
            <Link
              href="/admin/settings"
              className="border-line bg-surface-subtle hover:border-accent/40 rounded-xl border p-3.5 text-xs transition-colors"
            >
              <p className="text-foreground font-semibold">Moedas, Taxas & Ambiente</p>
              <p className="text-muted-foreground mt-0.5">
                Habilitar/desabilitar moedas em tempo real e configurar taxa padrão da plataforma.
              </p>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

