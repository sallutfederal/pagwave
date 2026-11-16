"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowDownLeft,
  Check,
  Copy,
  ExternalLink,
  FlaskConical,
  QrCode,
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
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import { DynamicFields } from "@/components/wallet/dynamic-fields";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  formatCurrencyAmount,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type CashinPanelProps = {
  selectedCurrency: XPagCurrency;
  isSandbox: boolean;
  onSelectCurrency: (currency: XPagCurrency) => void;
  onSuccessRefresh: () => void;
};

function CopyChip({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const doCopy = async () => {
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="border-line bg-surface-subtle flex items-center justify-between gap-2 rounded-xl border px-3 py-2">
      <div className="min-w-0">
        <p className="text-muted-foreground text-[10px] tracking-wide uppercase">{label}</p>
        <p className="text-foreground truncate font-mono text-xs">{value}</p>
      </div>
      <Button type="button" size="icon" variant="ghost" onClick={doCopy} className="size-8 shrink-0">
        {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
      </Button>
    </div>
  );
}

export function CashinPanel({
  selectedCurrency,
  isSandbox,
  onSelectCurrency,
  onSuccessRefresh,
}: CashinPanelProps) {
  const spec = CURRENCY_SPECS[selectedCurrency];
  const [method, setMethod] = useState<string>(spec.cashinMethods[0]?.id ?? "");
  const [mode, setMode] = useState<"dynamic" | "static">("dynamic");
  const [amountInput, setAmountInput] = useState("100");
  const [description, setDescription] = useState("");
  const [payer, setPayer] = useState<Record<string, string>>({});

  const [submitting, setSubmitting] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cashinResult, setCashinResult] = useState<Record<string, unknown> | null>(null);
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);

  const activeMethodMeta = spec.cashinMethods.find((m) => m.id === method);
  const canUseStatic = Boolean(activeMethodMeta?.supportsOpenValue);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSimResult(null);

    const effectiveMode = canUseStatic ? mode : "dynamic";
    const numAmount =
      effectiveMode === "static" ? undefined : Number(amountInput.replace(",", "."));

    if (effectiveMode === "dynamic" && (!numAmount || !Number.isFinite(numAmount) || numAmount <= 0)) {
      setErrorMsg("Informe um valor positivo para a cobrança dinâmica.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/cashin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: selectedCurrency,
          method,
          mode: effectiveMode,
          amount: numAmount,
          description: description.trim() || undefined,
          payer,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        result?: Record<string, unknown>;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Falha ao gerar instrução de recebimento.");
        return;
      }
      setCashinResult(json.result ?? {});
      onSuccessRefresh();
    } catch {
      setErrorMsg("Erro de comunicação ao criar cobrança.");
    } finally {
      setSubmitting(false);
    }
  };

  const requestNumber =
    typeof cashinResult?.request_number === "string" ? cashinResult.request_number : null;

  const handleSimulate = async (status: "paid" | "failed" | "expired") => {
    if (!requestNumber) return;
    setSimulating(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/wallet/sandbox/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_number: requestNumber,
          status,
        }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        message?: string;
        result?: Record<string, unknown>;
      };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Erro ao simular status no Sandbox.");
        return;
      }
      setSimResult(json.result ?? {});
      onSuccessRefresh();
    } finally {
      setSimulating(false);
    }
  };

  const payeeData = (cashinResult?.payee_data ?? {}) as Record<string, unknown>;
  const qrSrc =
    (typeof cashinResult?.qr_img === "string" && cashinResult.qr_img) ||
    (typeof cashinResult?.qr_url === "string" && cashinResult.qr_url) ||
    (typeof payeeData.barcode === "string" && payeeData.barcode) ||
    null;

  const copyPasteValue =
    (typeof cashinResult?.copyPaste === "string" && cashinResult.copyPaste) ||
    (typeof cashinResult?.copy_paste === "string" && cashinResult.copy_paste) ||
    (typeof cashinResult?.code === "string" && cashinResult.code) ||
    null;

  const checkoutUrl =
    typeof cashinResult?.checkout_url === "string" ? cashinResult.checkout_url : null;

  return (
    <div className="grid items-start gap-6 xl:grid-cols-12">
      <Card className="p-5 sm:p-6 xl:col-span-7">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-foreground text-base font-semibold">
                Receber / Depositar na Carteira (Cash-in)
              </h3>
              <p className="text-muted-foreground text-xs">
                Gere Pix dinâmico ou estático, CLABE/OXXO, Nequi/Bre-B, CVU argentino ou depósito cripto.
              </p>
            </div>
            <CurrencyBadge currency={selectedCurrency} />
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Moeda / País de recebimento
              </label>
              <Select
                value={selectedCurrency}
                onValueChange={(v) => onSelectCurrency(v as XPagCurrency)}
              >
                <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {XPAG_CURRENCIES.map((code) => (
                    <SelectItem key={code} value={code}>
                      {code} — {CURRENCY_SPECS[code].countryName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Método local / rede
              </label>
              <Select
                value={method}
                onValueChange={(next) => {
                  setMethod(next);
                  const nextMeta = spec.cashinMethods.find((m) => m.id === next);
                  if (!nextMeta?.supportsOpenValue) setMode("dynamic");
                }}
              >
                <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {spec.cashinMethods.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {activeMethodMeta ? (
            <p className="text-muted-foreground rounded-xl border border-white/10 bg-surface-subtle px-3.5 py-2 text-xs">
              {activeMethodMeta.description}
            </p>
          ) : null}

          {canUseStatic ? (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMode("dynamic")}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    mode === "dynamic"
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface-subtle text-muted-foreground hover:text-foreground",
                  )}
                >
                  Cobrança dinâmica (valor fixo)
                </button>
                <button
                  type="button"
                  onClick={() => setMode("static")}
                  className={cn(
                    "rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    mode === "static"
                      ? "border-accent bg-accent text-accent-fg"
                      : "border-line bg-surface-subtle text-muted-foreground hover:text-foreground",
                  )}
                >
                  Valor aberto / estática (sem amount)
                </button>
              </div>
              {mode === "static" ? (
                <p className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-3.5 py-2 text-[11px] text-amber-200">
                  Instruções de valor aberto recebem múltiplos pagamentos com{" "}
                  <code className="font-mono">origin: &quot;static&quot;</code> e são reconciliadas pelo{" "}
                  <code className="font-mono">e2e</code> único de cada pagamento.
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="grid gap-3.5 sm:grid-cols-2">
            {mode === "dynamic" || !canUseStatic ? (
              <div>
                <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                  Valor ({selectedCurrency}) <span className="text-accent">*</span>
                </label>
                <Input
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder={spec.integerOnly ? "Ex.: 25000" : "Ex.: 100.00"}
                  className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-sm"
                />
              </div>
            ) : null}

            <div className={mode === "static" && canUseStatic ? "sm:col-span-2" : undefined}>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Descrição (opcional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Depósito carteira ou pedido #1042"
                className="bg-surface-subtle border-line text-foreground h-10 rounded-xl text-sm"
              />
            </div>
          </div>

          <DynamicFields
            fields={spec.cashinPayerFields}
            values={payer}
            onChange={(k, v) => setPayer((prev) => ({ ...prev, [k]: v }))}
          />

          {errorMsg ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              <ArrowDownLeft className="size-4" />
              {submitting ? "Gerando instrução..." : `Gerar instrução em ${selectedCurrency}`}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4 xl:col-span-5">
        {!cashinResult ? (
          <Card className="flex flex-col items-center justify-center gap-3 p-8 text-center">
            <span className="bg-surface-subtle border-line text-muted-foreground grid size-12 place-items-center rounded-2xl border">
              <QrCode className="size-5" />
            </span>
            <p className="text-foreground text-sm font-medium">
              Instrução de depósito aparecerá aqui
            </p>
            <p className="text-muted-foreground text-xs">
              Dependendo da moeda, exibiremos QR Code, Copia e Cola, CLABE, voucher OXXO, CVU argentino ou endereço cripto com valor micro-ajustado.
            </p>
          </Card>
        ) : (
          <Card className="space-y-4 p-5">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-foreground text-sm font-semibold">Instrução pronta</p>
                {typeof cashinResult.status === "string" ? (
                  <p className="text-muted-foreground text-xs">
                    Status: <span className="text-accent font-mono">{cashinResult.status}</span>
                  </p>
                ) : null}
              </div>
              {typeof cashinResult.amount === "number" ? (
                <span className="text-foreground font-mono text-sm font-semibold">
                  {formatCurrencyAmount(cashinResult.amount, selectedCurrency)}
                </span>
              ) : null}
            </div>

            {selectedCurrency === "USDT" || selectedCurrency === "USDC" ? (
              <p className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-200">
                Envie exatamente o valor retornado (incluindo os micro-centavos) para garantir a reconciliação automática on-chain.
              </p>
            ) : null}

            {qrSrc ? (
              <div className="flex justify-center rounded-2xl bg-white p-4">
                <Image
                  unoptimized
                  src={qrSrc}
                  alt={`QR / Código ${selectedCurrency}`}
                  width={210}
                  height={210}
                  className="h-auto max-h-52 w-auto object-contain"
                />
              </div>
            ) : null}

            <div className="space-y-2">
              {copyPasteValue ? <CopyChip label="Copia e Cola / Código" value={copyPasteValue} /> : null}
              {typeof cashinResult.clabe === "string" ? (
                <CopyChip label="CLABE SPEI" value={cashinResult.clabe} />
              ) : null}
              {typeof cashinResult.deposit_address === "string" ? (
                <CopyChip
                  label={`Endereço de depósito (${spec.cryptoNetwork || selectedCurrency})`}
                  value={cashinResult.deposit_address}
                />
              ) : null}
              {typeof cashinResult.breb_key === "string" ? (
                <CopyChip label="Chave Bre-B" value={cashinResult.breb_key} />
              ) : null}
              {typeof payeeData.accountNumber === "string" ? (
                <CopyChip label="CVU / Conta destino" value={payeeData.accountNumber} />
              ) : null}
              {typeof payeeData.reference === "string" ? (
                <CopyChip label="Referência de pagamento" value={payeeData.reference} />
              ) : null}
              {requestNumber ? <CopyChip label="request_number" value={requestNumber} /> : null}
              {typeof cashinResult.transaction_id === "string" ? (
                <CopyChip label="transaction_id" value={cashinResult.transaction_id} />
              ) : null}
            </div>

            {checkoutUrl ? (
              <a
                href={checkoutUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-accent text-accent-fg hover:bg-accent/90 flex h-10 w-full items-center justify-center gap-2 rounded-full text-xs font-semibold transition-colors"
              >
                Abrir página de checkout <ExternalLink className="size-3.5" />
              </a>
            ) : null}

            {isSandbox && requestNumber ? (
              <div className="border-t border-white/10 pt-4">
                <p className="text-muted-foreground mb-2 flex items-center gap-1.5 text-xs font-medium">
                  <FlaskConical className="size-3.5 text-amber-300" />
                  Simular desfecho no Sandbox
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={simulating}
                    onClick={() => handleSimulate("paid")}
                    className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/15"
                  >
                    Pago
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={simulating}
                    onClick={() => handleSimulate("failed")}
                    className="border-red-500/30 text-red-300 hover:bg-red-500/15"
                  >
                    Falhou
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={simulating}
                    onClick={() => handleSimulate("expired")}
                  >
                    Expirado
                  </Button>
                </div>
                {simResult ? (
                  <pre className="text-muted-foreground mt-3 max-h-40 overflow-auto rounded-xl bg-black/30 p-2.5 font-mono text-[10px]">
                    {JSON.stringify(simResult, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </Card>
        )}
      </div>
    </div>
  );
}
