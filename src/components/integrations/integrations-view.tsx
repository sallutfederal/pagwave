"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { Check, Copy, Eye, EyeOff, KeyRound, RefreshCw, Save, Webhook } from "lucide-react";
import { useI18n } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type CredentialData = {
  id: string;
  label: string;
  clientId: string;
  secretPreview: string;
  secret?: string;
  webhookUrl: string;
  requestCount: number;
  lastUsedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

type ApiLogData = {
  id: string;
  clientId: string;
  method: string;
  endpoint: string;
  currency?: string;
  statusCode: number;
  ok: boolean;
  errorCode?: string;
  latencyMs: number;
  createdAt: string;
};

function CopyButton({
  value,
  label = "Copiar",
  size = "sm",
}: {
  value: string;
  label?: string;
  size?: "sm" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={size}
      onClick={handleCopy}
      className={size === "icon" ? "size-9 shrink-0" : "shrink-0 text-xs"}
    >
      {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      {size === "sm" ? (copied ? "Copiado" : label) : null}
    </Button>
  );
}

const subscribeNoop = () => () => {};

export function IntegrationsView() {
  const { modules } = useI18n();
  const mi = modules.integrations;
  const [loading, setLoading] = useState(true);
  const [credential, setCredential] = useState<CredentialData | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [logs, setLogs] = useState<ApiLogData[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [labelInput, setLabelInput] = useState("");
  const [webhookInput, setWebhookInput] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);
  const [rotating, setRotating] = useState(false);
  const [configNotice, setConfigNotice] = useState<string | null>(null);

  const [refreshTick, setRefreshTick] = useState(0);
  const baseOrigin = useSyncExternalStore(
    subscribeNoop,
    () => window.location.origin,
    () => "https://seu-dominio.com",
  );

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/integrations/keys", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        credential?: CredentialData;
        logs?: ApiLogData[];
        message?: string;
      } | null;

      if (cancelled) return;
      if (res.ok && json?.ok && json.credential) {
        setCredential(json.credential);
        setLabelInput(json.credential.label);
        setWebhookInput(json.credential.webhookUrl);
        setLogs(json.logs ?? []);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Não foi possível carregar suas credenciais de API.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const fetchRevealedSecret = useCallback(async (): Promise<string | null> => {
    if (revealedSecret) return revealedSecret;
    const res = await fetch("/api/integrations/keys?reveal=1", { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean;
      credential?: CredentialData;
    } | null;
    if (res.ok && json?.ok && json.credential?.secret) {
      setRevealedSecret(json.credential.secret);
      return json.credential.secret;
    }
    return null;
  }, [revealedSecret]);

  const toggleRevealSecret = async () => {
    if (revealedSecret) {
      setRevealedSecret(null);
      return;
    }
    await fetchRevealedSecret();
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setConfigNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/integrations/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          label: labelInput,
          webhookUrl: webhookInput,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        credential?: CredentialData;
        message?: string;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Falha ao salvar configurações.");
        return;
      }
      if (json.credential) setCredential(json.credential);
      setConfigNotice("Configurações da integração atualizadas com sucesso.");
    } finally {
      setSavingConfig(false);
    }
  };

  const handleRotate = async () => {
    setRotating(true);
    setConfigNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/integrations/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate" }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        credential?: CredentialData;
        message?: string;
      };
      if (!res.ok || !json.ok || !json.credential) {
        setErrorMsg(json.message || "Erro ao rotacionar credenciais.");
        return;
      }
      setCredential(json.credential);
      setRevealedSecret(json.credential.secret ?? null);
      setConfigNotice(
        "Novo par exclusivo de Client ID e Secret gerado. A chave anterior foi revogada.",
      );
    } finally {
      setRotating(false);
    }
  };

  return (
    <div className="space-y-6">
      {errorMsg ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {errorMsg}
        </Card>
      ) : null}

      {/* Credentials Card */}
      <Card className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="bg-accent-soft text-accent grid size-9 place-items-center rounded-xl">
                <KeyRound className="size-4" />
              </span>
              <div>
                <h3 className="text-foreground text-sm font-semibold">
                  {mi.credentialsTitle}
                </h3>
                <p className="text-muted-foreground text-xs">
                  X-Client-Id · X-Client-Secret
                </p>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={rotating || loading}
              onClick={handleRotate}
            >
              <RefreshCw className={cn("size-3.5", rotating && "animate-spin")} />
              {rotating ? "Rotacionando..." : "Rotacionar chaves"}
            </Button>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Base URL da API Pagwave
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={`${baseOrigin}/api/v1`}
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
                />
                <CopyButton value={`${baseOrigin}/api/v1`} size="icon" />
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                X-Client-Id (exclusivo do usuário)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={loading ? "Gerando credencial..." : credential?.clientId ?? ""}
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
                />
                {credential ? <CopyButton value={credential.clientId} size="icon" /> : null}
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                X-Client-Secret (use apenas no seu backend)
              </label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={
                    loading
                      ? "••••••••••••"
                      : revealedSecret ?? credential?.secretPreview ?? ""
                  }
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  title={revealedSecret ? "Ocultar secret" : "Revelar secret"}
                  onClick={toggleRevealSecret}
                  className="size-9 shrink-0"
                >
                  {revealedSecret ? (
                    <EyeOff className="size-3.5" />
                  ) : (
                    <Eye className="size-3.5" />
                  )}
                </Button>
                {revealedSecret ? <CopyButton value={revealedSecret} size="icon" /> : null}
              </div>
            </div>
          </div>

          <form
            onSubmit={handleSaveConfig}
            className="space-y-4 border-t border-white/10 pt-4"
          >
            <div className="grid gap-3.5 sm:grid-cols-2">
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Nome da aplicação
                </label>
                <Input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  placeholder="Ex.: Checkout Principal"
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="text-muted-foreground mb-1.5 flex items-center gap-1.5 text-xs font-medium">
                  <Webhook className="size-3.5 text-accent" />
                  Webhook URL padrão (opcional)
                </label>
                <Input
                  value={webhookInput}
                  onChange={(e) => setWebhookInput(e.target.value)}
                  placeholder="https://api.seusistema.com/webhooks/pagwave"
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
                />
              </div>
            </div>

            {configNotice ? (
              <div className="rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3.5 py-2 text-xs text-emerald-200">
                {configNotice}
              </div>
            ) : null}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs">
                Requisições autenticadas com esta chave:{" "}
                <span className="text-foreground font-mono font-semibold">
                  {credential?.requestCount ?? 0}
                </span>
                {credential?.lastUsedAt
                  ? ` · Último uso: ${new Date(credential.lastUsedAt).toLocaleString("pt-BR")}`
                  : ""}
              </p>
              <Button type="submit" size="sm" disabled={savingConfig || loading}>
                <Save className="size-3.5" />
                {savingConfig ? "Salvando..." : "Salvar configurações"}
              </Button>
            </div>
          </form>
        </Card>

      {/* Request Logs Table */}
      <Card className="space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Últimas chamadas autenticadas na sua API ({logs.length})
            </h3>
            <p className="text-muted-foreground text-xs">
              Auditoria isolada das requisições recebidas em <code className="text-foreground">/api/v1/*</code> usando suas credenciais.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setRefreshTick((t) => t + 1)}
          >
            <RefreshCw className="size-3.5" />
            Atualizar logs
          </Button>
        </div>

        {logs.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-xs">
            Nenhuma chamada registrada ainda. Integre suas aplicações seguindo{" "}
            <Link href="/docs" target="_blank" rel="noopener noreferrer" className="text-accent underline">
              /docs
            </Link>
            .
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-white/10">
                  <th className="py-2 pr-4 font-medium">Endpoint</th>
                  <th className="py-2 pr-4 font-medium">Moeda</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Latência</th>
                  <th className="py-2 font-medium">Data / Hora</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td className="text-foreground py-2.5 pr-4 font-mono">{log.endpoint}</td>
                    <td className="text-muted-foreground py-2.5 pr-4 font-mono">
                      {log.currency || "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                          log.ok
                            ? "bg-emerald-500/15 text-emerald-300"
                            : "bg-red-500/15 text-red-300",
                        )}
                      >
                        {log.statusCode}
                        {log.errorCode ? ` · ${log.errorCode}` : ""}
                      </span>
                    </td>
                    <td className="text-muted-foreground py-2.5 pr-4 font-mono">
                      {log.latencyMs} ms
                    </td>
                    <td className="text-muted-foreground py-2.5">
                      {new Date(log.createdAt).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
