"use client";

import { useState } from "react";
import { CheckCircle2, RefreshCw, Send, ShieldCheck } from "lucide-react";

import { useI18n } from "@/components/locale-provider";
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
import type { BalancePayload } from "@/components/wallet/types";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  formatCurrencyAmount,
  type XPagCurrency,
} from "@/lib/xpag/currencies";

type P2PTransferPanelProps = {
  balanceData: BalancePayload | null;
  selectedCurrency: XPagCurrency;
  onSelectCurrency: (currency: XPagCurrency) => void;
  onSuccessRefresh: () => void;
};

type TransferReceipt = {
  referenceId: string;
  amount: string;
  fee: string;
  netAmount: string;
  currencyCode: string;
  recipientEmail: string;
  recipientName: string;
  status: string;
};

export function P2PTransferPanel({
  balanceData,
  selectedCurrency,
  onSelectCurrency,
  onSuccessRefresh,
}: P2PTransferPanelProps) {
  const { messages } = useI18n();
  const mw = messages.wallet;

  const [recipientEmail, setRecipientEmail] = useState("");
  const [amountInput, setAmountInput] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransferReceipt | null>(null);

  const spec = CURRENCY_SPECS[selectedCurrency];
  const available = balanceData?.balances?.[selectedCurrency]?.available ?? 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setReceipt(null);

    const email = recipientEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      setErrorMsg(mw.p2pEmail);
      return;
    }

    const numAmount = Number(amountInput.replace(",", "."));
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setErrorMsg("Invalid amount.");
      return;
    }

    if (selectedCurrency === "CLP" && !Number.isInteger(numAmount)) {
      setErrorMsg("CLP requires integer amount.");
      return;
    }

    if (numAmount > available) {
      setErrorMsg(`${selectedCurrency}: ${mw.p2pAvailable} ${formatCurrencyAmount(available, selectedCurrency)}`);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/wallet/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: selectedCurrency,
          recipientEmail: email,
          amount: numAmount,
          description: description.trim() || undefined,
        }),
      });

      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        message?: string;
        transfer?: TransferReceipt;
      } | null;

      if (!res.ok || !json?.ok || !json.transfer) {
        setErrorMsg(json?.message || "Transfer failed.");
        return;
      }

      setReceipt(json.transfer);
      setAmountInput("");
      setDescription("");
      onSuccessRefresh();
    } catch {
      setErrorMsg("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-12">
      <Card className="space-y-5 p-6 xl:col-span-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-foreground text-base font-semibold">{mw.p2pTitle}</h3>
            <p className="text-muted-foreground text-xs">{mw.p2pDesc}</p>
          </div>
          <CurrencyBadge currency={selectedCurrency} />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {mw.p2pCurrency}
              </label>
              <Select
                value={selectedCurrency}
                onValueChange={(value) => {
                  onSelectCurrency(value as XPagCurrency);
                  setErrorMsg(null);
                  setReceipt(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {XPAG_CURRENCIES.map((code) => {
                    const bal = balanceData?.balances?.[code]?.available ?? 0;
                    return (
                      <SelectItem key={code} value={code}>
                        {code} — {mw.availableLabel}: {formatCurrencyAmount(bal, code)}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-muted-foreground block text-xs font-medium">
                  {mw.p2pAmount} ({selectedCurrency})
                </label>
                <button
                  type="button"
                  onClick={() => available > 0 && setAmountInput(String(available))}
                  className="text-accent text-[11px] font-medium hover:underline"
                >
                  {mw.p2pAvailable}: {formatCurrencyAmount(available, selectedCurrency)}
                </button>
              </div>
              <Input
                type="number"
                step={spec.integerOnly ? "1" : "any"}
                min="0"
                placeholder={spec.integerOnly ? "25000" : "50.00"}
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {mw.p2pEmail}
              </label>
              <Input
                type="email"
                placeholder="email@pagwave.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-muted-foreground mb-1.5 block text-xs font-medium">
                {mw.p2pNote}
              </label>
              <Input
                type="text"
                maxLength={140}
                placeholder={mw.p2pNotePlaceholder}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {errorMsg ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
              {errorMsg}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <p className="text-muted-foreground text-[11px]">{mw.p2pFooterHint}</p>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {submitting ? mw.p2pSubmitting : mw.p2pSubmit}
            </Button>
          </div>
        </form>
      </Card>

      <div className="space-y-4 xl:col-span-5">
        {receipt ? (
          <Card className="space-y-3 border-emerald-400/30 bg-emerald-500/10 p-5">
            <div className="flex items-center gap-2 text-emerald-300">
              <CheckCircle2 className="size-4" />
              <p className="text-sm font-semibold">{mw.p2pSuccessTitle}</p>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{mw.p2pReference}</span>
                <span className="text-foreground font-mono">{receipt.referenceId}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{mw.p2pRecipient}</span>
                <span className="text-foreground text-right font-medium">
                  {receipt.recipientName} ({receipt.recipientEmail})
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">{mw.p2pCredited}</span>
                <span className="font-mono font-semibold text-emerald-300">
                  {receipt.netAmount} {receipt.currencyCode}
                </span>
              </div>
            </div>
          </Card>
        ) : null}

        <Card className="space-y-2.5 p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-accent size-4" />
            <h4 className="text-foreground text-sm font-semibold">{mw.p2pHowTitle}</h4>
          </div>
          <ul className="text-muted-foreground space-y-1.5 text-xs">
            <li>• {mw.p2pHow1}</li>
            <li>• {mw.p2pHow2}</li>
            <li>• {mw.p2pHow3}</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
