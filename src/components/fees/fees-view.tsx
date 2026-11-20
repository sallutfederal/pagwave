"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calculator,
  CheckCircle2,
  Percent,
  RefreshCw,
  Send,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyIcon } from "@/components/wallet/currency-badge";
import { XPAG_CURRENCIES, type XPagCurrency } from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type FeeTransactionType = "WITHDRAWAL" | "DEPOSIT" | "TRANSFER_OUT" | "EXCHANGE";

type EffectiveFeeRule = {
  transactionType: FeeTransactionType;
  currencyCode: string;
  flatFee: number;
  percentFee: number;
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
  source: "USER_CUSTOM" | "PLATFORM_DEFAULT";
  customScope?: "CURRENCY" | "GLOBAL";
  defaultFlatFee: number;
  defaultPercentFee: number;
  defaultMinFee: number;
  defaultMaxFee: number | null;
  defaultIsActive: boolean;
};

type CurrencyInfo = {
  code: string;
  name: string;
  symbol: string;
  decimals: number;
  type: string;
};

type FeesPayload = {
  ok: boolean;
  effectiveFees: EffectiveFeeRule[];
  customNote: string | null;
  customUpdatedAt: string | null;
  hasCustomFees: boolean;
  platformFeeBps: number;
  currencies: CurrencyInfo[];
};

const OPERATION_META: Record<
  FeeTransactionType,
  {
    label: string;
    shortLabel: string;
    description: string;
    icon: typeof ArrowUpRight;
    highlight?: boolean;
  }
> = {
  WITHDRAWAL: {
    label: "Saque (Cash-out)",
    shortLabel: "Saque",
    description: "Pix Out, transferência bancária ou envio cripto externo.",
    icon: ArrowUpRight,
    highlight: true,
  },
  DEPOSIT: {
    label: "Depósito (Cash-in)",
    shortLabel: "Depósito",
    description: "Pix In, cobrança dinâmica/estática e recebimentos.",
    icon: ArrowDownLeft,
  },
  TRANSFER_OUT: {
    label: "Transferência P2P",
    shortLabel: "Transferência P2P",
    description: "Envio instantâneo entre contas PagWave.",
    icon: Send,
  },
  EXCHANGE: {
    label: "Conversão FX",
    shortLabel: "Conversão FX",
    description: "Conversão entre carteiras de moedas distintas.",
    icon: RefreshCw,
  },
};

const OPERATION_ORDER: FeeTransactionType[] = [
  "WITHDRAWAL",
  "DEPOSIT",
  "TRANSFER_OUT",
  "EXCHANGE",
];

function isXPagCurrency(code: string): code is XPagCurrency {
  return (XPAG_CURRENCIES as readonly string[]).includes(code);
}

function formatCurrencyValue(value: number, code: string): string {
  const decimals = code === "CLP" ? 0 : code === "USDT" || code === "USDC" ? 4 : 2;
  const formatted = value.toLocaleString("pt-BR", {
    minimumFractionDigits: code === "CLP" ? 0 : 2,
    maximumFractionDigits: decimals,
  });
  return `${formatted} ${code}`;
}

function formatPercent(decimalRate: number): string {
  return `${(decimalRate * 100).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  })}%`;
}

function calculatePreviewFee(amount: number, rule: EffectiveFeeRule | undefined) {
  if (!rule || !rule.isActive || !Number.isFinite(amount) || amount <= 0) {
    return { fee: 0, netAmount: Math.max(0, amount || 0) };
  }
  const raw = rule.flatFee + amount * rule.percentFee;
  let fee = Math.max(rule.minFee, raw);
  if (rule.maxFee !== null && rule.maxFee > 0) {
    fee = Math.min(rule.maxFee, fee);
  }
  const netAmount = Math.max(0, amount - fee);
  return { fee, netAmount };
}

function renderRuleFormula(rule: EffectiveFeeRule): string {
  if (!rule.isActive || (rule.percentFee === 0 && rule.flatFee === 0 && rule.minFee === 0)) {
    return "Isento (0,00%)";
  }
  const parts: string[] = [];
  if (rule.percentFee > 0) parts.push(formatPercent(rule.percentFee));
  if (rule.flatFee > 0) parts.push(formatCurrencyValue(rule.flatFee, rule.currencyCode));
  return parts.join(" + ");
}

export function FeesView() {
  const [data, setData] = useState<FeesPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedCurrency, setSelectedCurrency] = useState<string>("BRL");
  const [tableFilterOp, setTableFilterOp] = useState<FeeTransactionType | "ALL">("ALL");

  const [simOp, setSimOp] = useState<FeeTransactionType>("WITHDRAWAL");
  const [simCurrency, setSimCurrency] = useState<string>("BRL");
  const [simAmount, setSimAmount] = useState<string>("1000");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/fees", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | (FeesPayload & { message?: string })
          | null;
        if (cancelled) return;
        if (res.ok && json?.ok) {
          setData(json);
          setErrorMsg(null);
        } else {
          setErrorMsg(json?.message || "Não foi possível carregar suas taxas agora.");
        }
      } catch {
        if (!cancelled) setErrorMsg("Erro de conexão ao consultar sua tabela de taxas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const currencies = useMemo(() => data?.currencies ?? [], [data]);

  const rulesForSelectedCurrency = useMemo(() => {
    const map = new Map<FeeTransactionType, EffectiveFeeRule>();
    for (const rule of data?.effectiveFees ?? []) {
      if (rule.currencyCode === selectedCurrency) {
        map.set(rule.transactionType, rule);
      }
    }
    return map;
  }, [data, selectedCurrency]);

  const simRule = useMemo(
    () =>
      (data?.effectiveFees ?? []).find(
        (r) => r.currencyCode === simCurrency && r.transactionType === simOp,
      ),
    [data, simCurrency, simOp],
  );

  const simNumericAmount = useMemo(() => {
    const normalized = simAmount.replace(",", ".").trim();
    const n = Number(normalized);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [simAmount]);

  const simResult = useMemo(
    () => calculatePreviewFee(simNumericAmount, simRule),
    [simNumericAmount, simRule],
  );

  const filteredRows = useMemo(() => {
    const list = data?.effectiveFees ?? [];
    if (tableFilterOp === "ALL") return list;
    return list.filter((r) => r.transactionType === tableFilterOp);
  }, [data, tableFilterOp]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="h-32 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="h-48 animate-pulse" />
          <Card className="h-48 animate-pulse" />
          <Card className="h-48 animate-pulse" />
          <Card className="h-48 animate-pulse" />
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <Card className="p-6">
        <p className="text-danger text-sm">{errorMsg}</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Status Banner + Currency Switcher */}
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3.5">
          <div
            className={cn(
              "mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-xl border",
              data?.hasCustomFees
                ? "border-success/30 bg-success-soft text-success"
                : "border-line bg-accent-soft text-accent",
            )}
          >
            {data?.hasCustomFees ? (
              <Sparkles className="size-5" />
            ) : (
              <Percent className="size-5" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-foreground text-sm font-semibold sm:text-base">
                {data?.hasCustomFees
                  ? "Condição Comercial Personalizada Ativa"
                  : "Tabela Padrão PagWave Ativa"}
              </h2>
              <Badge tone={data?.hasCustomFees ? "success" : "neutral"}>
                {data?.hasCustomFees ? "Personalizada" : "Padrão"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-xs leading-relaxed sm:text-sm">
              {data?.hasCustomFees
                ? data.customNote
                  ? `Observação comercial: ${data.customNote}`
                  : "Sua conta possui regras personalizadas definidas pelo administrador e aplicadas automaticamente nas movimentações."
                : "As taxas abaixo são aplicadas automaticamente nas suas operações de saque, depósito, transferências P2P e câmbio."}
            </p>
          </div>
        </div>

        <div className="border-line border-t pt-4">
          <p className="text-muted-foreground mb-2.5 text-[11px] font-medium uppercase tracking-wider">
            Selecione a moeda para visualizar
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {currencies.map((c) => {
              const active = c.code === selectedCurrency;
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedCurrency(c.code);
                    setSimCurrency(c.code);
                  }}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                    active
                      ? "border-accent/50 bg-accent-soft text-foreground shadow-xs"
                      : "border-line bg-surface-subtle text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                  )}
                >
                  {isXPagCurrency(c.code) ? (
                    <CurrencyIcon
                      currency={c.code}
                      className="size-6 rounded-lg border-0 bg-transparent shadow-none"
                    />
                  ) : null}
                  <span>{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

      {/* 4 Operation Cards for Selected Currency (Withdrawal prominently highlighted) */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {OPERATION_ORDER.map((op) => {
          const meta = OPERATION_META[op];
          const Icon = meta.icon;
          const rule = rulesForSelectedCurrency.get(op);
          const isCustom = rule?.source === "USER_CUSTOM";
          const isFree =
            !rule ||
            !rule.isActive ||
            (rule.percentFee === 0 && rule.flatFee === 0 && rule.minFee === 0);

          return (
            <Card
              key={op}
              className={cn(
                "flex flex-col justify-between p-5 transition-colors",
                meta.highlight ? "border-accent/40 bg-accent-soft/35" : "",
              )}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl border",
                        meta.highlight
                          ? "border-accent/35 bg-accent-soft text-accent"
                          : "border-line bg-surface-subtle text-muted-foreground",
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-foreground text-sm font-semibold">{meta.label}</h3>
                      <p className="text-muted-foreground text-[11px]">{selectedCurrency}</p>
                    </div>
                  </div>
                  <Badge tone={isCustom ? "success" : "neutral"} className="shrink-0">
                    {isCustom ? "Personalizada" : "Padrão"}
                  </Badge>
                </div>

                <div>
                  <p
                    className={cn(
                      "text-xl font-semibold tabular-nums tracking-tight",
                      isFree ? "text-success" : "text-foreground",
                    )}
                  >
                    {rule ? renderRuleFormula(rule) : "Isento (0,00%)"}
                  </p>
                  <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
                    {meta.description}
                  </p>
                </div>
              </div>

              {rule ? (
                <div className="border-line text-muted-foreground mt-5 space-y-1.5 border-t pt-3.5 text-[11px]">
                  <div className="flex items-center justify-between gap-2">
                    <span>Percentual</span>
                    <span className="text-foreground font-mono font-medium">
                      {rule.isActive ? formatPercent(rule.percentFee) : "0,00% (isento)"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span>Taxa fixa</span>
                    <span className="text-foreground font-mono font-medium">
                      {rule.isActive
                        ? formatCurrencyValue(rule.flatFee, rule.currencyCode)
                        : formatCurrencyValue(0, rule.currencyCode)}
                    </span>
                  </div>
                  {rule.minFee > 0 ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>Taxa mínima</span>
                      <span className="text-foreground font-mono font-medium">
                        {formatCurrencyValue(rule.minFee, rule.currencyCode)}
                      </span>
                    </div>
                  ) : null}
                  {rule.maxFee !== null && rule.maxFee > 0 ? (
                    <div className="flex items-center justify-between gap-2">
                      <span>Teto máximo</span>
                      <span className="text-foreground font-mono font-medium">
                        {formatCurrencyValue(rule.maxFee, rule.currencyCode)}
                      </span>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </Card>
          );
        })}
      </div>

      {/* Interactive Fee Simulator */}
      <Card className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="border-line bg-surface-subtle text-accent flex size-9 shrink-0 items-center justify-center rounded-xl border">
            <Calculator className="size-4" />
          </div>
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Simulador de Taxa &amp; Valor Líquido
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Veja exatamente quanto será cobrado e quanto será enviado ou recebido antes de operar.
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-1.5">
            <label className="text-muted-foreground block text-xs font-medium">Operação</label>
            <Select
              value={simOp}
              onValueChange={(v) => setSimOp(v as FeeTransactionType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {OPERATION_ORDER.map((op) => (
                  <SelectItem key={op} value={op}>
                    {OPERATION_META[op].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground block text-xs font-medium">Moeda</label>
            <Select value={simCurrency} onValueChange={setSimCurrency}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} — {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-muted-foreground block text-xs font-medium">
              Valor bruto ({simCurrency})
            </label>
            <Input
              type="number"
              min="0"
              step="any"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              placeholder="Ex: 1000"
            />
          </div>
        </div>

        <div className="border-line bg-surface-subtle grid gap-4 rounded-xl border p-4 sm:grid-cols-3">
          <div>
            <p className="text-muted-foreground text-[11px]">Valor Bruto</p>
            <p className="text-foreground mt-1 text-base font-semibold tabular-nums">
              {formatCurrencyValue(simNumericAmount, simCurrency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[11px]">
              Taxa Aplicada ({simRule?.source === "USER_CUSTOM" ? "Personalizada" : "Padrão"})
            </p>
            <p className="text-warning mt-1 text-base font-semibold tabular-nums">
              {formatCurrencyValue(simResult.fee, simCurrency)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-[11px]">
              {simOp === "WITHDRAWAL"
                ? "Valor Líquido Enviado no Saque"
                : simOp === "DEPOSIT"
                  ? "Crédito Líquido na Carteira"
                  : "Valor Líquido Efetivo"}
            </p>
            <p className="text-success mt-1 flex items-center gap-1.5 text-base font-semibold tabular-nums">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{formatCurrencyValue(simResult.netAmount, simCurrency)}</span>
            </p>
          </div>
        </div>
      </Card>

      {/* Complete Matrix Table */}
      <Card className="overflow-hidden">
        <div className="border-line flex flex-col gap-3 border-b p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h3 className="text-foreground text-sm font-semibold">
              Tabela Completa por Moeda e Operação
            </h3>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Todas as taxas efetivas vigentes na sua conta agora.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["ALL", ...OPERATION_ORDER] as const).map((op) => (
              <button
                key={op}
                type="button"
                onClick={() => setTableFilterOp(op)}
                className={cn(
                  "rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                  tableFilterOp === op
                    ? "border-accent/50 bg-accent-soft text-foreground"
                    : "border-line bg-surface-subtle text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                )}
              >
                {op === "ALL" ? "Todas" : OPERATION_META[op].shortLabel}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-xs">
            <thead className="border-line bg-surface-subtle text-muted-foreground border-b">
              <tr>
                <th className="px-5 py-3.5 font-medium">Moeda</th>
                <th className="px-5 py-3.5 font-medium">Operação</th>
                <th className="px-5 py-3.5 font-medium">Taxa (%)</th>
                <th className="px-5 py-3.5 font-medium">Taxa Fixa</th>
                <th className="px-5 py-3.5 font-medium">Mín / Máx</th>
                <th className="px-5 py-3.5 font-medium">Origem</th>
              </tr>
            </thead>
            <tbody className="divide-line divide-y">
              {filteredRows.map((rule) => {
                const isCustom = rule.source === "USER_CUSTOM";
                const isWaived =
                  !rule.isActive ||
                  (rule.percentFee === 0 && rule.flatFee === 0 && rule.minFee === 0);

                return (
                  <tr
                    key={`${rule.currencyCode}:${rule.transactionType}`}
                    className="hover:bg-surface-subtle/60 transition-colors"
                  >
                    <td className="text-foreground px-5 py-3.5 font-medium">
                      <div className="flex items-center gap-2.5">
                        {isXPagCurrency(rule.currencyCode) ? (
                          <CurrencyIcon
                            currency={rule.currencyCode}
                            className="size-6 rounded-lg border-0 bg-transparent shadow-none"
                          />
                        ) : null}
                        <span className="font-semibold">{rule.currencyCode}</span>
                      </div>
                    </td>
                    <td className="text-foreground/90 px-5 py-3.5">
                      {OPERATION_META[rule.transactionType].label}
                    </td>
                    <td className="text-foreground px-5 py-3.5 font-mono tabular-nums">
                      {isWaived ? (
                        <span className="text-success font-medium">0,00%</span>
                      ) : (
                        formatPercent(rule.percentFee)
                      )}
                    </td>
                    <td className="text-muted-foreground px-5 py-3.5 font-mono tabular-nums">
                      {rule.isActive
                        ? formatCurrencyValue(rule.flatFee, rule.currencyCode)
                        : formatCurrencyValue(0, rule.currencyCode)}
                    </td>
                    <td className="text-muted-foreground px-5 py-3.5 font-mono tabular-nums">
                      {rule.minFee > 0 || (rule.maxFee !== null && rule.maxFee > 0)
                        ? `${rule.minFee > 0 ? `Mín ${formatCurrencyValue(rule.minFee, rule.currencyCode)}` : "—"} / ${
                            rule.maxFee !== null && rule.maxFee > 0
                              ? `Máx ${formatCurrencyValue(rule.maxFee, rule.currencyCode)}`
                              : "Sem teto"
                          }`
                        : "—"}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge tone={isCustom ? "success" : "neutral"}>
                        {isCustom
                          ? rule.customScope === "GLOBAL"
                            ? "Personalizada (Global)"
                            : "Personalizada"
                          : "Padrão"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
