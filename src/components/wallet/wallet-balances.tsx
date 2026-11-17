"use client";

import { ArrowDownLeft, ArrowUpRight, Lock, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CurrencyBadge } from "@/components/wallet/currency-badge";
import type { BalancePayload } from "@/components/wallet/types";
import {
  CURRENCY_SPECS,
  XPAG_CURRENCIES,
  formatCurrencyAmount,
  type XPagCurrency,
} from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type WalletBalancesProps = {
  balanceData: BalancePayload | null;
  loading: boolean;
  error: string | null;
  selectedCurrency: XPagCurrency;
  onSelectCurrency: (currency: XPagCurrency) => void;
  onQuickDeposit: (currency: XPagCurrency) => void;
  onQuickWithdraw: (currency: XPagCurrency) => void;
  onRefresh: () => void;
};

export function WalletBalances({
  balanceData,
  loading,
  error,
  selectedCurrency,
  onSelectCurrency,
  onQuickDeposit,
  onQuickWithdraw,
  onRefresh,
}: WalletBalancesProps) {
  const blockedSet = new Set(balanceData?.blocked_currencies ?? []);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-foreground text-base font-semibold tracking-tight">
            Sua Carteira Multi-moeda & Redes Cripto
          </h2>
          <p className="text-muted-foreground text-xs">
            Saldo individual da sua conta (disponível vs. bloqueado em saque/MED)
            {balanceData?.kycLevel !== undefined ? ` · KYC Nível ${balanceData.kycLevel}/3` : ""}.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {balanceData?.isSandbox ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-500/10 px-3 py-1 text-[11px] font-medium text-amber-300">
              <span className="size-1.5 rounded-full bg-amber-400" />
              Modo Sandbox XPag
            </span>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
            Atualizar
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {error}
        </Card>
      ) : null}

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {XPAG_CURRENCIES.map((code) => {
          const entry = balanceData?.balances?.[code];
          const available = entry?.available ?? 0;
          const blocked = entry?.blocked ?? 0;
          const isBlockedCurrency = blockedSet.has(code);
          const isSelected = selectedCurrency === code;
          const spec = CURRENCY_SPECS[code];

          return (
            <Card
              key={code}
              onClick={() => onSelectCurrency(code)}
              className={cn(
                "group cursor-pointer p-4 transition-all",
                isSelected
                  ? "border-accent/60 bg-surface-hover ring-accent/25 ring-1"
                  : "hover:border-foreground/20",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <CurrencyBadge currency={code} />
                {isBlockedCurrency ? (
                  <span
                    title="Moeda bloqueada na conta"
                    className="inline-flex items-center gap-1 rounded-full border border-red-400/30 bg-red-500/15 px-2 py-0.5 text-[10px] font-medium text-red-300"
                  >
                    <ShieldAlert className="size-3" />
                    Bloqueada
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-1">
                <p className="text-muted-foreground text-[11px]">Disponível</p>
                <p className="text-foreground truncate font-mono text-lg font-semibold tracking-tight tabular-nums">
                  {loading && !balanceData
                    ? "Carregando..."
                    : formatCurrencyAmount(available, code)}
                </p>

                {blocked > 0 ? (
                  <p className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-300">
                    <Lock className="size-3" />
                    Bloqueado MED: {formatCurrencyAmount(blocked, code)}
                  </p>
                ) : (
                  <p className="text-muted-foreground truncate text-[11px]">
                    {spec.countryName}
                  </p>
                )}
              </div>

              <div className="mt-3.5 flex items-center gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 px-2 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickDeposit(code);
                  }}
                >
                  <ArrowDownLeft className="size-3 text-emerald-400" />
                  Depositar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 flex-1 px-2 text-[11px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onQuickWithdraw(code);
                  }}
                >
                  <ArrowUpRight className="size-3 text-amber-300" />
                  Sacar
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

