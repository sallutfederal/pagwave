"use client";

import { useEffect, useState } from "react";
import { KeyRound, RefreshCw, RotateCcw, Webhook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type GlobalKeyRow = {
  id: string;
  userId: string;
  ownerEmail: string;
  ownerName: string;
  label: string;
  clientId: string;
  secretPreview: string;
  webhookUrl: string;
  requestCount: number;
  lastUsedAt: string | null;
  createdAt: string;
};

type GlobalLogRow = {
  id: string;
  userId: string;
  clientId: string;
  endpoint: string;
  currency?: string;
  statusCode: number;
  ok: boolean;
  errorCode?: string;
  latencyMs: number;
  createdAt: string;
};

type GlobalWebhookRow = {
  id: string;
  type: string;
  status: string;
  currency?: string;
  e2e?: string;
  externalId?: string;
  verifiedSignature: boolean;
  receivedAt: string;
};

export function AdminIntegrationsView() {
  const [keys, setKeys] = useState<GlobalKeyRow[]>([]);
  const [logs, setLogs] = useState<GlobalLogRow[]>([]);
  const [webhooks, setWebhooks] = useState<GlobalWebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/integrations", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        keys?: GlobalKeyRow[];
        logs?: GlobalLogRow[];
        webhooks?: GlobalWebhookRow[];
        message?: string;
      } | null;
      if (cancelled) return;
      if (res.ok && json?.ok) {
        setKeys(json.keys ?? []);
        setLogs(json.logs ?? []);
        setWebhooks(json.webhooks ?? []);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar auditoria de integrações.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const handleRevoke = async (userId: string, ownerEmail: string) => {
    setBusyUserId(userId);
    setNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke", userId }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        clientId?: string;
        message?: string;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Falha ao rotacionar credencial.");
        return;
      }
      setNotice(
        `Chave anterior de ${ownerEmail} revogada. Novo Client ID emitido: ${json.clientId}.`,
      );
      setRefreshTick((t) => t + 1);
    } finally {
      setBusyUserId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-xs">
          {keys.length} credenciais ativas · {logs.length} chamadas recentes · {webhooks.length} webhooks recebidos
        </p>

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
          Atualizar
        </Button>
      </div>

      {notice ? (
        <Card className="border-emerald-400/30 bg-emerald-500/10 p-4 text-xs text-emerald-200">
          {notice}
        </Card>
      ) : null}

      {errorMsg ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {errorMsg}
        </Card>
      ) : null}

      <Card className="space-y-4 p-5">
        <div className="flex items-center gap-2">
          <KeyRound className="text-accent size-4" />
          <h3 className="text-foreground text-sm font-semibold">
            Credenciais Pagwave Emitidas por Usuário ({keys.length})
          </h3>
        </div>

        {keys.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            Nenhuma credencial emitida ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-white/10">
                  <th className="py-2 pr-4 font-medium">Usuário</th>
                  <th className="py-2 pr-4 font-medium">Client ID</th>
                  <th className="py-2 pr-4 font-medium">Webhook</th>
                  <th className="py-2 pr-4 font-medium">Chamadas</th>
                  <th className="py-2 font-medium text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {keys.map((k) => (
                  <tr key={k.id}>
                    <td className="py-3 pr-4">
                      <p className="text-foreground font-medium">{k.ownerName}</p>
                      <p className="text-muted-foreground text-[11px]">{k.ownerEmail}</p>
                    </td>
                    <td className="py-3 pr-4 font-mono text-[11px]">
                      <p className="text-foreground">{k.clientId}</p>
                      <p className="text-muted-foreground">{k.secretPreview}</p>
                    </td>
                    <td className="text-muted-foreground py-3 pr-4 font-mono text-[11px] max-w-52 truncate">
                      {k.webhookUrl || "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-foreground">
                      {k.requestCount}
                      {k.lastUsedAt ? (
                        <p className="text-muted-foreground font-sans text-[10px]">
                          {new Date(k.lastUsedAt).toLocaleString("pt-BR")}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 text-right">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busyUserId === k.userId}
                        onClick={() => handleRevoke(k.userId, k.ownerEmail)}
                        className="h-8 border-amber-400/30 text-xs text-amber-300"
                      >
                        <RotateCcw className="size-3.5" />
                        Revogar & Rotacionar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <Card className="space-y-3 p-5 xl:col-span-7">
          <h3 className="text-foreground text-sm font-semibold">
            Tráfego Global /api/v1/* ({logs.length})
          </h3>
          {logs.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Sem chamadas de API registradas.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="border-line bg-surface-subtle flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-xs"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-mono">
                      {log.endpoint} {log.currency ? `(${log.currency})` : ""}
                    </p>
                    <p className="text-muted-foreground truncate font-mono text-[10px]">
                      {log.clientId} · {log.latencyMs}ms
                    </p>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                      log.ok
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-red-500/15 text-red-300",
                    )}
                  >
                    {log.statusCode}
                    {log.errorCode ? ` · ${log.errorCode}` : ""}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-3 p-5 xl:col-span-5">
          <div className="flex items-center gap-2">
            <Webhook className="text-accent size-4" />
            <h3 className="text-foreground text-sm font-semibold">
              Webhooks Globais Recebidos ({webhooks.length})
            </h3>
          </div>
          {webhooks.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Nenhum webhook recebido ainda.
            </p>
          ) : (
            <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
              {webhooks.map((w) => (
                <div
                  key={w.id}
                  className="border-line bg-surface-subtle rounded-xl border p-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-foreground font-mono font-semibold">
                      {w.type} · {w.status}
                    </span>
                    <span className="text-emerald-300 text-[10px]">
                      {w.verifiedSignature ? "HMAC OK" : "UNVERIFIED"}
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-1 truncate font-mono text-[11px]">
                    {w.e2e || w.externalId || w.id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

