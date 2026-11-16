"use client";

import { useState } from "react";
import { ArrowUpRight, CheckCircle2, RefreshCw, ShieldAlert } from "lucide-react";
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
import type { BalancePayload, ClientBeneficiary } from "@/components/wallet/types";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  formatCurrencyAmount,
  summarizeDestination,
  validateDestinationInput,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type CashoutPanelProps = {
  balanceData: BalancePayload | null;
  beneficiaries: ClientBeneficiary[];
  selectedCurrency: XPagCurrency;
  preselectedBeneficiaryId: string | null;
  onSelectCurrency: (currency: XPagCurrency) => void;
  onSuccessRefresh: () => void;
};

function makeExternalId() {
  return `pw_out_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

export function CashoutPanel({
  balanceData,
  beneficiaries,
  selectedCurrency,
  preselectedBeneficiaryId,
  onSelectCurrency,
  onSuccessRefresh,
}: CashoutPanelProps) {
  const [sourceMode, setSourceMode] = useState<"saved" | "adhoc">(
    preselectedBeneficiaryId || beneficiaries.length > 0 ? "saved" : "adhoc",
  );
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>(
    preselectedBeneficiaryId || "",
  );
  const [rail, setRail] = useState<string>(
    CURRENCY_SPECS[selectedCurrency].cashoutRails[0].id,
  );
  const [details, setDetails] = useState<Record<string, string>>({});
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  const [externalId, setExternalId] = useState(makeExternalId);
  const [saveAfter, setSaveAfter] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resultData, setResultData] = useState<Record<string, unknown> | null>(null);

  const savedForCurrency = beneficiaries.filter((b) =>
    sourceMode === "saved" ? true : b.currency === selectedCurrency,
  );

  const activeSaved =
    sourceMode === "saved"
      ? beneficiaries.find((b) => b.id === selectedBeneficiaryId) ??
        beneficiaries.find((b) => b.currency === selectedCurrency) ??
        beneficiaries[0]
      : undefined;

  const effectiveCurrency = activeSaved ? activeSaved.currency : selectedCurrency;
  const spec = CURRENCY_SPECS[effectiveCurrency];
  const balanceEntry = balanceData?.balances?.[effectiveCurrency];
  const available = balanceEntry?.available ?? 0;
  const isBlockedCurrency = (balanceData?.blocked_currencies ?? []).includes(effectiveCurrency);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
    setResultData(null);

    if (isBlockedCurrency) {
      setErrorMsg(`Saques em ${effectiveCurrency} estão bloqueados nesta conta no momento.`);
      return;
    }

    const numAmount = Number(amountInput.replace(",", "."));
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setErrorMsg("Informe um valor numérico válido maior que zero.");
      return;
    }

    if (effectiveCurrency === "CLP" && !Number.isInteger(numAmount)) {
      setErrorMsg("CLP exige valor inteiro sem casas decimais.");
      return;
    }

    if (sourceMode === "saved" && !activeSaved) {
      setErrorMsg("Nenhuma chave cadastrada. Alterne para destino avulso ou cadastre uma chave.");
      return;
    }

    if (sourceMode === "adhoc") {
      const destErr = validateDestinationInput(selectedCurrency, rail, details);
      if (destErr) {
        setErrorMsg(destErr);
        return;
      }
      if (saveAfter && saveLabel.trim().length < 2) {
        setErrorMsg("Informe um apelido para salvar este destino nas suas chaves.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (sourceMode === "adhoc" && saveAfter) {
        await fetch("/api/wallet/beneficiaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: saveLabel.trim(),
            currency: selectedCurrency,
            rail,
            details,
          }),
        });
      }

      const payload =
        sourceMode === "saved" && activeSaved
          ? {
              beneficiaryId: activeSaved.id,
              amount: numAmount,
              externalId,
              description: description.trim() || undefined,
            }
          : {
              currency: selectedCurrency,
              rail,
              details,
              amount: numAmount,
              externalId,
              description: description.trim() || undefined,
            };

      const res = await fetch("/api/wallet/cashout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error_code?: string;
        message?: string;
        result?: Record<string, unknown>;
      };

      if (!res.ok || !json.ok) {
        setErrorCode(json.error_code ?? null);
        setErrorMsg(json.message || "Falha ao solicitar saque na XPag.");
        return;
      }

      setResultData(json.result ?? {});
      setExternalId(makeExternalId());
      setAmountInput("");
      onSuccessRefresh();
    } catch {
      setErrorMsg("Erro de comunicação ao solicitar saque.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-12">
      <Card className="p-5 sm:p-6 xl:col-span-8">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-foreground text-base font-semibold">
                Solicitar Saque Multi-país / Cripto
              </h3>
              <p className="text-muted-foreground text-xs">
                Envie via chave cadastrada ou informe um destino na hora para qualquer moeda suportada.
              </p>
            </div>

            <div className="flex items-center gap-1 rounded-full border border-white/10 bg-surface-subtle p-1">
              <button
                type="button"
                onClick={() => setSourceMode("saved")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  sourceMode === "saved"
                    ? "bg-accent text-accent-fg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Chave salva ({savedForCurrency.length})
              </button>
              <button
                type="button"
                onClick={() => setSourceMode("adhoc")}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  sourceMode === "adhoc"
                    ? "bg-accent text-accent-fg"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                Novo destino
              </button>
            </div>
          </div>

          {sourceMode === "saved" ? (
            beneficiaries.length === 0 ? (
              <div className="rounded-2xl border border-amber-400/25 bg-amber-500/10 p-4 text-xs text-amber-200">
                Você ainda não tem chaves salvas. Use a aba{" "}
                <strong>&ldquo;Novo destino&rdquo;</strong> ou cadastre na aba{" "}
                <strong>&ldquo;Chaves & Carteiras&rdquo;</strong>.
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-muted-foreground block text-xs font-medium">
                  Destino cadastrado
                </label>
                <Select
                  value={activeSaved?.id || ""}
                  onValueChange={(id) => {
                    setSelectedBeneficiaryId(id);
                    const found = beneficiaries.find((b) => b.id === id);
                    if (found) onSelectCurrency(found.currency);
                  }}
                >
                  <SelectTrigger className="bg-surface-subtle border-line text-foreground h-11 w-full rounded-xl px-3.5 text-sm">
                    <SelectValue placeholder="Selecione uma chave ou endereço salvo" />
                  </SelectTrigger>
                  <SelectContent>
                    {beneficiaries.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        [{b.currency}] {b.label} — {b.summary}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {activeSaved ? (
                  <div className="border-line bg-surface-subtle flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
                    <CurrencyBadge currency={activeSaved.currency} />
                    <span className="text-muted-foreground font-mono text-xs">
                      {summarizeDestination(
                        activeSaved.currency,
                        activeSaved.rail,
                        activeSaved.details,
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                    Moeda / País de destino
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
                    Trilho de pagamento
                  </label>
                  <Select value={rail} onValueChange={setRail}>
                    <SelectTrigger className="bg-surface-subtle border-line text-foreground h-10 w-full rounded-xl px-3.5 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {spec.cashoutRails.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DynamicFields
                fields={spec.cashoutFields}
                activeMethod={rail}
                values={details}
                onChange={(k, v) => setDetails((prev) => ({ ...prev, [k]: v }))}
              />

              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-surface-subtle px-3.5 py-2.5">
                <label className="text-muted-foreground inline-flex cursor-pointer items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={saveAfter}
                    onChange={(e) => setSaveAfter(e.target.checked)}
                    className="accent-accent size-4 rounded"
                  />
                  Salvar este destino na minha agenda de chaves
                </label>
                {saveAfter ? (
                  <Input
                    value={saveLabel}
                    onChange={(e) => setSaveLabel(e.target.value)}
                    placeholder="Apelido (ex.: Fornecedor MX)"
                    className="bg-surface border-line text-foreground h-8 max-w-xs rounded-lg text-xs"
                  />
                ) : null}
              </div>
            </div>
          )}

          <div className="grid gap-3.5 sm:grid-cols-3">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Valor ({effectiveCurrency}) <span className="text-accent">*</span>
              </label>
              <Input
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder={spec.integerOnly ? "Ex.: 25000" : "Ex.: 150.00"}
                className="bg-surface-subtle border-line text-foreground h-10 rounded-xl font-mono text-sm"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                Descrição (opcional)
              </label>
              <Input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex.: Repasse fornecedor"
                className="bg-surface-subtle border-line text-foreground h-10 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 flex items-center justify-between text-xs font-medium">
                <span>Idempotência (external_id)</span>
                <button
                  type="button"
                  onClick={() => setExternalId(makeExternalId())}
                  className="text-accent hover:underline"
                >
                  <RefreshCw className="inline size-3" /> novo
                </button>
              </label>
              <Input
                value={externalId}
                onChange={(e) => setExternalId(e.target.value)}
                className="bg-surface-subtle border-line text-muted-foreground h-10 rounded-xl font-mono text-xs"
              />
            </div>
          </div>

          {errorMsg ? (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              <ShieldAlert className="mt-0.5 size-4 shrink-0 text-red-300" />
              <div>
                <p className="font-medium">{errorMsg}</p>
                {errorCode ? (
                  <p className="mt-0.5 font-mono text-[11px] text-red-300/80">
                    error_code: {errorCode}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <p className="text-muted-foreground text-xs">
              Saldo disponível em {effectiveCurrency}:{" "}
              <span className="text-foreground font-mono font-semibold">
                {formatCurrencyAmount(available, effectiveCurrency)}
              </span>
            </p>
            <Button type="submit" disabled={submitting}>
              <ArrowUpRight className="size-4" />
              {submitting ? "Enviando saque..." : `Confirmar saque em ${effectiveCurrency}`}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4 xl:col-span-4">
        <Card className="space-y-3 p-5">
          <p className="text-foreground text-sm font-semibold">Regras do trilho {effectiveCurrency}</p>
          <ul className="text-muted-foreground space-y-2 text-xs">
            <li>• Idempotência garantida pelo campo <code className="text-foreground">external_id</code>.</li>
            <li>• Cash-out não aceita <code className="text-foreground">splits</code> na XPag.</li>
            {effectiveCurrency === "COP" ? (
              <li>• Colômbia opera exclusivamente via <strong>BREB</strong> neste endpoint.</li>
            ) : null}
            {effectiveCurrency === "USDT" ? (
              <li>• USDT aceita apenas endereços <strong>TRON (TRC20)</strong> iniciados por &ldquo;T&rdquo;.</li>
            ) : null}
            {effectiveCurrency === "USDC" ? (
              <li>• USDC aceita apenas endereços <strong>Solana (SPL)</strong> em Base58 válido.</li>
            ) : null}
            {effectiveCurrency === "CLP" ? (
              <li>• Pesos chilenos exigem valor inteiro e RUT validado.</li>
            ) : null}
          </ul>
        </Card>

        {resultData ? (
          <Card className="space-y-3 border-emerald-400/30 bg-emerald-500/10 p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="size-4" />
              <p className="text-sm font-semibold">Solicitação enviada à XPag</p>
            </div>
            <pre className="text-foreground max-h-60 overflow-auto rounded-xl bg-black/30 p-3 font-mono text-[11px]">
              {JSON.stringify(resultData, null, 2)}
            </pre>
          </Card>
        ) : null}
      </div>
    </div>
  );
}
