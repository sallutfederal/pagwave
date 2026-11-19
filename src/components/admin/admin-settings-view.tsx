"use client";

import { useEffect, useState } from "react";
import { Save, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import { CURRENCY_SPECS, XPAG_CURRENCIES } from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type AdminConfig = {
  environmentMode: "auto" | "sandbox" | "production";
  feeBps: number;
  disabledCurrencies: string[];
  maintenanceNotice: string;
  globalWebhookUrl: string;
  updatedAt: string;
};

type XPagEnvInfo = {
  baseUrl: string;
  isSandbox: boolean;
  clientIdMasked: string;
  envWebhookConfigured: boolean;
};

export function AdminSettingsView() {
  const [config, setConfig] = useState<AdminConfig>({
    environmentMode: "auto",
    feeBps: 90,
    disabledCurrencies: [],
    maintenanceNotice: "",
    globalWebhookUrl: "",
    updatedAt: "",
  });
  const [xpagInfo, setXpagInfo] = useState<XPagEnvInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        config?: AdminConfig;
        xpag?: XPagEnvInfo;
        message?: string;
      } | null;
      if (cancelled) return;
      if (res.ok && json?.ok && json.config) {
        setConfig(json.config);
        setXpagInfo(json.xpag ?? null);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar configurações globais.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleCurrency = (code: string) => {
    setConfig((prev) => {
      const disabled = prev.disabledCurrencies.includes(code)
        ? prev.disabledCurrencies.filter((c) => c !== code)
        : [...prev.disabledCurrencies, code];
      return { ...prev, disabledCurrencies: disabled };
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          environmentMode: config.environmentMode,
          feeBps: Number(config.feeBps),
          disabledCurrencies: config.disabledCurrencies,
          maintenanceNotice: config.maintenanceNotice,
          globalWebhookUrl: config.globalWebhookUrl,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        config?: AdminConfig;
        message?: string;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Falha ao salvar configurações globais.");
        return;
      }
      if (json.config) setConfig(json.config);
      setNotice("Configurações operacionais salvas e aplicadas em tempo real.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
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

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <Card className="space-y-5 p-5 sm:p-6 xl:col-span-7">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Parâmetros Operacionais da Plataforma
            </h3>
            <p className="text-muted-foreground text-xs">
              Controle de taxa padrão, ambiente e avisos operacionais aplicados na API e carteiras.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Modo de Ambiente
              </label>
              <Select
                value={config.environmentMode}
                disabled={loading}
                onValueChange={(v) =>
                  setConfig((p) => ({
                    ...p,
                    environmentMode: v as "auto" | "sandbox" | "production",
                  }))
                }
              >
                <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Automático (via .env.local)</SelectItem>
                  <SelectItem value="sandbox">Sandbox Forçado</SelectItem>
                  <SelectItem value="production">Produção</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Taxa padrão Pagwave (basis points · 100 = 1,00%)
              </label>
              <Input
                type="number"
                min={0}
                max={2000}
                value={config.feeBps}
                onChange={(e) =>
                  setConfig((p) => ({ ...p, feeBps: Number(e.target.value) || 0 }))
                }
                className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              URL global de Webhook fallback (opcional)
            </label>
            <Input
              value={config.globalWebhookUrl}
              onChange={(e) =>
                setConfig((p) => ({ ...p, globalWebhookUrl: e.target.value }))
              }
              placeholder="https://api.pagwave.com/webhooks/xpag"
              className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
            />
          </div>

          <div>
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Aviso operacional / manutenção (opcional)
            </label>
            <Input
              value={config.maintenanceNotice}
              onChange={(e) =>
                setConfig((p) => ({ ...p, maintenanceNotice: e.target.value }))
              }
              placeholder="Ex.: Janela programada em SPEI entre 02h e 03h"
              className="bg-surface-subtle border-line text-foreground h-10 rounded-xl text-sm"
            />
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving || loading}>
              <Save className="size-4" />
              {saving ? "Salvando..." : "Salvar configurações globais"}
            </Button>
          </div>
        </Card>

        <Card className="space-y-4 p-5 sm:p-6 xl:col-span-5">
          <h3 className="text-foreground text-sm font-semibold">
            Credencial Mestre XPag (Servidor)
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="border-line bg-surface-subtle rounded-xl border p-3">
              <p className="text-muted-foreground text-[11px]">Base URL</p>
              <p className="text-foreground mt-0.5 font-mono">{xpagInfo?.baseUrl || "—"}</p>
            </div>
            <div className="border-line bg-surface-subtle rounded-xl border p-3">
              <p className="text-muted-foreground text-[11px]">Client ID ativo no servidor</p>
              <p className="text-foreground mt-0.5 font-mono">
                {xpagInfo?.clientIdMasked || "—"}
              </p>
            </div>
            <div className="border-line bg-surface-subtle rounded-xl border p-3">
              <p className="text-muted-foreground text-[11px]">Status Sandbox / Webhook Env</p>
              <p className="text-foreground mt-0.5">
                {xpagInfo?.isSandbox ? "Sandbox ativo" : "Produção ativa"} · Webhook env:{" "}
                {xpagInfo?.envWebhookConfigured ? "Configurado" : "Não definido"}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Per-currency Kill Switch */}
      <Card className="space-y-4 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Controle de Moedas & Trilhos na API (/api/v1/*)
            </h3>
            <p className="text-muted-foreground text-xs">
              Desative temporariamente qualquer moeda/rede caso um provedor local entre em manutenção.
            </p>
          </div>
          {config.disabledCurrencies.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
              <ShieldAlert className="size-3.5" />
              {config.disabledCurrencies.length} desabilitada(s)
            </span>
          ) : null}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {XPAG_CURRENCIES.map((code) => {
            const disabled = config.disabledCurrencies.includes(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => toggleCurrency(code)}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border p-4 text-left transition-all",
                  disabled
                    ? "border-red-500/40 bg-red-500/10 opacity-85"
                    : "border-line bg-surface-subtle hover:border-foreground/25",
                )}
              >
                <CurrencyBadge currency={code} />
                <div className="flex items-center justify-between border-t border-white/10 pt-2.5 text-[11px]">
                  <span className="text-muted-foreground">
                    {CURRENCY_SPECS[code].countryName}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 font-semibold",
                      disabled
                        ? "bg-red-500/20 text-red-200"
                        : "bg-emerald-500/15 text-emerald-300",
                    )}
                  >
                    {disabled ? "Bloqueada" : "Ativa"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </Card>
    </form>
  );
}

