"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  CheckCircle2,
  Search,
  Webhook,
} from "lucide-react";
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
import type {
  ClientWalletActivity,
  ClientWebhookEvent,
} from "@/components/wallet/types";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  formatCurrencyAmount,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

const CONVERTIBLE_CURRENCIES = XPAG_CURRENCIES.filter(
  (c) => CURRENCY_SPECS[c].convertible,
);

type ConversionPanelProps = {
  onSuccessRefresh: () => void;
};

export function ConversionPanel({ onSuccessRefresh }: ConversionPanelProps) {
  const [from, setFrom] = useState<XPagCurrency>("BRL");
  const [to, setTo] = useState<XPagCurrency>("USDT");
  const [amountInput, setAmountInput] = useState("100");
  const [simulating, setSimulating] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<Record<string, unknown> | null>(null);
  const [executed, setExecuted] = useState<Record<string, unknown> | null>(null);

  const runAction = async (action: "simulate" | "execute") => {
    setErrorMsg(null);
    if (action === "execute") setExecuted(null);

    const amount = Number(amountInput.replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      setErrorMsg("Informe um valor válido maior que zero.");
      return;
    }

    if (from === "COP" && amount < 50_000) {
      setErrorMsg("Conversões saindo de COP exigem mínimo de COP$ 50.000.");
      return;
    }

    const setter = action === "simulate" ? setSimulating : setExecuting;
    setter(true);
    try {
      const res = await fetch("/api/wallet/conversion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, from, to, amount }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        simulation?: Record<string, unknown>;
        conversion?: Record<string, unknown>;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Não foi possível processar a conversão.");
        return;
      }

      if (action === "simulate") {
        setQuote(json.simulation ?? {});
      } else {
        setExecuted(json.conversion ?? {});
        setQuote(null);
        onSuccessRefresh();
      }
    } catch {
      setErrorMsg("Falha de comunicação ao converter moedas.");
    } finally {
      setter(false);
    }
  };

  const quotedOut =
    typeof quote?.converted_amount === "number"
      ? quote.converted_amount
      : typeof quote?.estimated_amount === "number"
        ? quote.estimated_amount
        : typeof quote?.net_amount === "number"
          ? quote.net_amount
          : null;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-12">
      <Card className="space-y-5 p-5 sm:p-6 xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-foreground text-base font-semibold">
              Conversão Interna entre Saldos XPag
            </h3>
            <p className="text-muted-foreground text-xs">
              Simule a taxa em tempo real e converta entre moedas fiduciárias e USDT.
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-surface-subtle px-2.5 py-1 text-[11px] text-muted-foreground">
            USDC não conversível
          </span>
        </div>

        <div className="grid items-end gap-3.5 sm:grid-cols-11">
          <div className="sm:col-span-5">
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              De (origem)
            </label>
            <Select
              value={from}
              onValueChange={(v) => {
                setFrom(v as XPagCurrency);
                setQuote(null);
              }}
            >
              <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONVERTIBLE_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} — {CURRENCY_SPECS[c].countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-center sm:col-span-1">
            <Button
              type="button"
              size="icon"
              variant="outline"
              title="Inverter par"
              onClick={() => {
                setFrom(to);
                setTo(from);
                setQuote(null);
              }}
              className="size-10 rounded-xl"
            >
              <ArrowLeftRight className="size-4" />
            </Button>
          </div>

          <div className="sm:col-span-5">
            <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
              Para (destino)
            </label>
            <Select
              value={to}
              onValueChange={(v) => {
                setTo(v as XPagCurrency);
                setQuote(null);
              }}
            >
              <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONVERTIBLE_CURRENCIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c} — {CURRENCY_SPECS[c].countryName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
            Valor de origem ({from})
          </label>
          <Input
            value={amountInput}
            onChange={(e) => {
              setAmountInput(e.target.value);
              setQuote(null);
            }}
            className="bg-surface-subtle border-line text-foreground h-11 rounded-xl font-mono text-base"
          />
        </div>

        {errorMsg ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {errorMsg}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            disabled={simulating || executing}
            onClick={() => runAction("simulate")}
          >
            {simulating ? "Cotando..." : "Simular cotação"}
          </Button>
          <Button
            type="button"
            disabled={simulating || executing}
            onClick={() => runAction("execute")}
          >
            <ArrowRight className="size-4" />
            {executing ? "Convertendo..." : `Converter ${from} → ${to}`}
          </Button>
        </div>
      </Card>

      <div className="space-y-4 xl:col-span-5">
        {quote ? (
          <Card className="space-y-3 border-accent/40 p-5">
            <p className="text-accent text-xs font-semibold uppercase tracking-wide">
              Prévia da Conversão
            </p>
            {quotedOut !== null ? (
              <p className="text-foreground font-mono text-2xl font-semibold">
                {formatCurrencyAmount(quotedOut, to)}
              </p>
            ) : null}
            <div className="text-muted-foreground space-y-1 text-xs">
              {typeof quote.rate === "number" ? <p>Taxa: {quote.rate}</p> : null}
              {typeof quote.fee === "number" ? (
                <p>
                  Taxa operacional: {quote.fee} {String(quote.fee_currency || from)}
                </p>
              ) : null}
            </div>
          </Card>
        ) : null}

        {executed ? (
          <Card className="space-y-3 border-emerald-400/30 bg-emerald-500/10 p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="size-4" />
              <p className="text-sm font-semibold">Conversão executada</p>
            </div>
            <pre className="text-foreground max-h-52 overflow-auto rounded-xl bg-black/30 p-3 font-mono text-[11px]">
              {JSON.stringify(executed, null, 2)}
            </pre>
          </Card>
        ) : null}

        <Card className="space-y-2 p-5 text-xs text-muted-foreground">
          <p className="text-foreground font-semibold">Notas importantes XPag</p>
          <p>• Origem em <strong>COP</strong> exige mínimo de COP$ 50.000.</p>
          <p>• Destino em <strong>CLP</strong> arredonda o resultado para peso inteiro.</p>
          <p>• <strong>USDC</strong> é bloqueado para conversões (`currency_not_convertible`).</p>
        </Card>
      </div>
    </div>
  );
}

type HistoryAndLookupPanelProps = {
  activities: ClientWalletActivity[];
  webhooks: ClientWebhookEvent[];
};

export function HistoryAndLookupPanel({
  activities,
  webhooks,
}: HistoryAndLookupPanelProps) {
  const [lookupKind, setLookupKind] = useState<"cashin" | "cashout">("cashin");
  const [lookupKey, setLookupKey] = useState<
    "transaction_id" | "request_number" | "e2e" | "external_id" | "clabe"
  >("transaction_id");
  const [lookupValue, setLookupValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupResult, setLookupResult] = useState<Record<string, unknown> | null>(null);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupResult(null);

    if (!lookupValue.trim()) {
      setLookupError("Informe o identificador para consultar na XPag.");
      return;
    }

    setSearching(true);
    try {
      const qs = new URLSearchParams({
        kind: lookupKind,
        [lookupKey]: lookupValue.trim(),
      });
      const res = await fetch(`/api/wallet/transactions?${qs.toString()}`);
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        result?: Record<string, unknown>;
      };
      if (!res.ok || !json.ok) {
        setLookupError(json.message || "Transação não encontrada na XPag.");
        return;
      }
      setLookupResult(json.result ?? {});
    } catch {
      setLookupError("Falha ao consultar transação na XPag.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4 p-5">
        <div>
          <h3 className="text-foreground text-sm font-semibold">
            Consulta Direta na API XPag (/consult-transaction & /consult-cashout)
          </h3>
          <p className="text-muted-foreground text-xs">
            Reconcilie qualquer recebimento ou saque por <code className="text-foreground">transaction_id</code>,{" "}
            <code className="text-foreground">request_number</code>, <code className="text-foreground">e2e</code>,{" "}
            <code className="text-foreground">external_id</code> ou <code className="text-foreground">clabe</code>.
          </p>
        </div>

        <form onSubmit={handleLookup} className="grid gap-3 sm:grid-cols-12">
          <div className="sm:col-span-3">
            <Select
              value={lookupKind}
              onValueChange={(v) => {
                const next = v as "cashin" | "cashout";
                setLookupKind(next);
                if (next === "cashout" && (lookupKey === "request_number" || lookupKey === "clabe")) {
                  setLookupKey("transaction_id");
                }
              }}
            >
              <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cashin">Cash-in (Recebimento)</SelectItem>
                <SelectItem value="cashout">Cash-out (Saque)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-3">
            <Select
              value={lookupKey}
              onValueChange={(v) =>
                setLookupKey(
                  v as "transaction_id" | "request_number" | "e2e" | "external_id" | "clabe",
                )
              }
            >
              <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transaction_id">transaction_id</SelectItem>
                <SelectItem value="e2e">e2e</SelectItem>
                <SelectItem value="external_id">external_id</SelectItem>
                {lookupKind === "cashin" ? (
                  <>
                    <SelectItem value="request_number">request_number</SelectItem>
                    <SelectItem value="clabe">clabe</SelectItem>
                  </>
                ) : null}
              </SelectContent>
            </Select>
          </div>

          <div className="sm:col-span-4">
            <Input
              value={lookupValue}
              onChange={(e) => setLookupValue(e.target.value)}
              placeholder={`Valor de ${lookupKey}`}
              className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-xs"
            />
          </div>

          <div className="sm:col-span-2">
            <Button type="submit" disabled={searching} className="h-10 w-full">
              <Search className="size-3.5" />
              {searching ? "Buscando" : "Consultar"}
            </Button>
          </div>
        </form>

        {lookupError ? (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-200">
            {lookupError}
          </div>
        ) : null}

        {lookupResult ? (
          <pre className="text-foreground max-h-60 overflow-auto rounded-xl bg-black/35 p-3.5 font-mono text-[11px]">
            {JSON.stringify(lookupResult, null, 2)}
          </pre>
        ) : null}
      </Card>

      <div className="grid items-start gap-6 xl:grid-cols-12">
        <Card className="space-y-4 p-5 xl:col-span-7">
          <div className="flex items-center justify-between">
            <h3 className="text-foreground text-sm font-semibold">
              Histórico recente desta conta ({activities.length})
            </h3>
          </div>

          {activities.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Nenhuma movimentação registrada ainda nesta carteira.
            </p>
          ) : (
            <div className="space-y-2.5">
              {activities.map((item) => (
                <div
                  key={item.id}
                  className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5"
                >
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          item.kind === "cashin" || item.kind === "transfer_in"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : item.kind === "cashout" || item.kind === "transfer_out"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-sky-500/15 text-sky-300",
                        )}
                      >
                        {item.kind === "transfer_in"
                          ? "P2P Recebido"
                          : item.kind === "transfer_out"
                            ? "P2P Enviado"
                            : item.kind}
                      </span>
                      <span className="text-foreground text-xs font-semibold">
                        {item.currency}
                        {item.toCurrency ? ` → ${item.toCurrency}` : ""}
                      </span>
                      <span className="text-muted-foreground font-mono text-[11px]">
                        [{item.status}]
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate font-mono text-[11px]">
                      {item.destinationSummary || item.externalId || item.transactionId || "—"}
                    </p>
                  </div>

                  <div className="text-right">
                    {typeof item.amount === "number" ? (
                      <p className="text-foreground font-mono text-xs font-semibold">
                        {item.amount.toLocaleString("pt-BR", {
                          maximumFractionDigits: 6,
                        })}{" "}
                        {item.currency}
                      </p>
                    ) : (
                      <p className="text-muted-foreground text-xs">Valor aberto</p>
                    )}
                    <p className="text-muted-foreground text-[10px]">
                      {new Date(item.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-4 p-5 xl:col-span-5">
          <div className="flex items-center gap-2">
            <Webhook className="text-accent size-4" />
            <h3 className="text-foreground text-sm font-semibold">
              Eventos Webhook XPag ({webhooks.length})
            </h3>
          </div>
          <p className="text-muted-foreground text-xs">
            Endpoint <code className="text-foreground">/api/webhooks/xpag</code> com validação HMAC-SHA256 e deduplicação por <code className="text-foreground">e2e</code>.
          </p>

          {webhooks.length === 0 ? (
            <p className="text-muted-foreground py-6 text-center text-xs">
              Nenhum webhook recebido ainda. Em produção, aponte <code className="text-foreground">XPAG_WEBHOOK_URL</code> para este endpoint HTTPS.
            </p>
          ) : (
            <div className="space-y-2.5">
              {webhooks.map((ev) => (
                <div
                  key={ev.id}
                  className="border-line bg-surface-subtle space-y-1 rounded-xl border p-3"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground font-mono font-semibold">
                      {ev.type} · {ev.status}
                    </span>
                    <span className="text-emerald-300 text-[10px]">HMAC OK</span>
                  </div>
                  <p className="text-muted-foreground truncate font-mono text-[11px]">
                    {ev.e2e || ev.requestNumber || ev.externalId || ev.id}
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

