"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  History,
  KeyRound,
  Send,
} from "lucide-react";
import { BeneficiariesPanel } from "@/components/wallet/beneficiaries-panel";
import { CashinPanel } from "@/components/wallet/cashin-panel";
import { CashoutPanel } from "@/components/wallet/cashout-panel";
import {
  ConversionPanel,
  HistoryAndLookupPanel,
} from "@/components/wallet/conversion-and-history";
import { P2PTransferPanel } from "@/components/wallet/p2p-transfer-panel";
import type {
  BalancePayload,
  CashinIntent,
  ClientBeneficiary,
  ClientWalletActivity,
  ClientWebhookEvent,
  WalletTab,
} from "@/components/wallet/types";
import { WalletBalances } from "@/components/wallet/wallet-balances";
import type { XPagCurrency } from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

const TABS: Array<{
  id: WalletTab;
  label: string;
  icon: typeof ArrowUpRight;
}> = [
  { id: "cashout", label: "Sacar (Cash-out)", icon: ArrowUpRight },
  { id: "cashin", label: "Depositar & Receber", icon: ArrowDownLeft },
  { id: "transfer", label: "Transferir (P2P)", icon: Send },
  { id: "beneficiaries", label: "Chaves & Carteiras", icon: KeyRound },
  { id: "convert", label: "Conversão FX", icon: ArrowLeftRight },
  { id: "history", label: "Extrato & Consultas", icon: History },
];

const VALID_TABS = new Set<WalletTab>([
  "cashout",
  "cashin",
  "transfer",
  "beneficiaries",
  "convert",
  "history",
]);

export function WalletView() {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab") as WalletTab | null;
  const [activeTab, setActiveTab] = useState<WalletTab>(() =>
    requestedTab && VALID_TABS.has(requestedTab) ? requestedTab : "cashout",
  );
  const [cashinIntent, setCashinIntent] = useState<CashinIntent>("self_deposit");
  const [selectedCurrency, setSelectedCurrency] = useState<XPagCurrency>("BRL");
  const [preselectedBeneficiaryId, setPreselectedBeneficiaryId] = useState<string | null>(
    null,
  );

  const [balanceData, setBalanceData] = useState<BalancePayload | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  const [beneficiaries, setBeneficiaries] = useState<ClientBeneficiary[]>([]);
  const [activities, setActivities] = useState<ClientWalletActivity[]>([]);
  const [webhooks, setWebhooks] = useState<ClientWebhookEvent[]>([]);
  const [refreshTick, setRefreshTick] = useState(0);

  const refreshAll = useCallback(() => {
    setBalanceLoading(true);
    setBalanceError(null);
    setRefreshTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const [balRes, benRes, txRes] = await Promise.allSettled([
        fetch("/api/wallet/balance", { cache: "no-store" }),
        fetch("/api/wallet/beneficiaries", { cache: "no-store" }),
        fetch("/api/wallet/transactions", { cache: "no-store" }),
      ]);

      if (cancelled) return;

      if (balRes.status === "fulfilled") {
        const json = (await balRes.value.json().catch(() => null)) as
          | (BalancePayload & { message?: string })
          | null;
        if (!cancelled) {
          if (balRes.value.ok && json?.ok) {
            setBalanceData(json);
            setBalanceError(null);
          } else {
            setBalanceError(json?.message || "Falha ao consultar saldos na XPag.");
          }
        }
      } else {
        setBalanceError("Não foi possível conectar ao serviço de saldo XPag.");
      }

      if (!cancelled) {
        setBalanceLoading(false);
      }

      if (benRes.status === "fulfilled" && benRes.value.ok) {
        const json = (await benRes.value.json().catch(() => null)) as {
          ok?: boolean;
          beneficiaries?: ClientBeneficiary[];
        } | null;
        if (!cancelled && json?.ok && json.beneficiaries) {
          setBeneficiaries(json.beneficiaries);
        }
      }

      if (txRes.status === "fulfilled" && txRes.value.ok) {
        const json = (await txRes.value.json().catch(() => null)) as {
          ok?: boolean;
          activities?: ClientWalletActivity[];
          webhooks?: ClientWebhookEvent[];
        } | null;
        if (!cancelled && json?.ok) {
          setActivities(json.activities ?? []);
          setWebhooks(json.webhooks ?? []);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  return (
    <div className="space-y-7">
      <WalletBalances
        balanceData={balanceData}
        loading={balanceLoading}
        error={balanceError}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
        onQuickDeposit={(currency) => {
          setSelectedCurrency(currency);
          setCashinIntent("self_deposit");
          setActiveTab("cashin");
        }}
        onQuickWithdraw={(currency) => {
          setSelectedCurrency(currency);
          setActiveTab("cashout");
        }}
        onRefresh={refreshAll}
      />

      <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-medium transition-all",
                isActive
                  ? "border-accent bg-accent text-accent-fg shadow-sm"
                  : "border-line bg-surface text-muted-foreground hover:border-foreground/25 hover:text-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "cashout" ? (
        <CashoutPanel
          key={`${selectedCurrency}:${preselectedBeneficiaryId ?? "none"}`}
          balanceData={balanceData}
          beneficiaries={beneficiaries}
          selectedCurrency={selectedCurrency}
          preselectedBeneficiaryId={preselectedBeneficiaryId}
          onSelectCurrency={setSelectedCurrency}
          onSuccessRefresh={refreshAll}
        />
      ) : null}

      {activeTab === "cashin" ? (
        <CashinPanel
          key={selectedCurrency}
          selectedCurrency={selectedCurrency}
          isSandbox={balanceData?.isSandbox ?? true}
          intent={cashinIntent}
          onChangeIntent={setCashinIntent}
          onSelectCurrency={setSelectedCurrency}
          onSuccessRefresh={refreshAll}
        />
      ) : null}

      {activeTab === "transfer" ? (
        <P2PTransferPanel
          balanceData={balanceData}
          selectedCurrency={selectedCurrency}
          onSelectCurrency={setSelectedCurrency}
          onSuccessRefresh={refreshAll}
        />
      ) : null}

      {activeTab === "beneficiaries" ? (
        <BeneficiariesPanel
          beneficiaries={beneficiaries}
          defaultCurrency={selectedCurrency}
          onChanged={refreshAll}
          onWithdrawWithBeneficiary={(item) => {
            setSelectedCurrency(item.currency);
            setPreselectedBeneficiaryId(item.id);
            setActiveTab("cashout");
          }}
        />
      ) : null}

      {activeTab === "convert" ? (
        <ConversionPanel onSuccessRefresh={refreshAll} />
      ) : null}

      {activeTab === "history" ? (
        <HistoryAndLookupPanel activities={activities} webhooks={webhooks} />
      ) : null}
    </div>
  );
}
