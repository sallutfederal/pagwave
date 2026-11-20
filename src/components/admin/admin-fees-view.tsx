"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Percent,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Shield,
  Sliders,
  Trash2,
  UserCog,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { Switch } from "@/components/ui/switch";
import { CurrencyIcon } from "@/components/wallet/currency-badge";
import { XPAG_CURRENCIES, type XPagCurrency } from "@/lib/xpag/currencies";
import { cn } from "@/lib/utils";

type FeeTransactionType = "WITHDRAWAL" | "DEPOSIT" | "TRANSFER_OUT" | "EXCHANGE";

type GlobalFeeConfig = {
  id: string;
  transactionType: FeeTransactionType;
  currencyCode: string;
  flatFee: number;
  percentFee: number;
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
  updatedAt: string;
};

type UserFeeOverrideRule = {
  transactionType: FeeTransactionType;
  currencyCode: string;
  flatFee: number;
  percentFee: number;
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
};

type UserOverrideSummary = {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  kycStatus: string;
  kycLevel: number;
  rules: UserFeeOverrideRule[];
  note: string;
  updatedAt: string | null;
};

type AdminFeesResponse = {
  ok: boolean;
  fees: GlobalFeeConfig[];
  platformFeeBps: number;
  currencies: string[];
  userOverrides: UserOverrideSummary[];
};

const OPERATIONS: Array<{
  type: FeeTransactionType;
  label: string;
  hint: string;
  icon: typeof ArrowUpRight;
  isWithdrawal?: boolean;
}> = [
  {
    type: "WITHDRAWAL",
    label: "Saque (Cash-out)",
    hint: "Pix Out, transferência bancária ou saque cripto.",
    icon: ArrowUpRight,
    isWithdrawal: true,
  },
  {
    type: "DEPOSIT",
    label: "Depósito (Cash-in)",
    hint: "Pix In, recebimentos dinâmicos e QR estático.",
    icon: ArrowDownLeft,
  },
  {
    type: "TRANSFER_OUT",
    label: "Transferência P2P",
    hint: "Transferência interna entre contas PagWave.",
    icon: Send,
  },
  {
    type: "EXCHANGE",
    label: "Conversão FX",
    hint: "Troca interna entre moedas diferentes.",
    icon: RefreshCw,
  },
];

function isXPagCurrency(code: string): code is XPagCurrency {
  return (XPAG_CURRENCIES as readonly string[]).includes(code);
}

type DraftOpForm = {
  percentStr: string;
  flatStr: string;
  minStr: string;
  maxStr: string;
  isActive: boolean;
};

function makeEmptyDraft(): DraftOpForm {
  return {
    percentStr: "0",
    flatStr: "0",
    minStr: "0",
    maxStr: "",
    isActive: true,
  };
}

function ruleToDraft(rule: {
  percentFee: number;
  flatFee: number;
  minFee: number;
  maxFee: number | null;
  isActive: boolean;
}): DraftOpForm {
  return {
    percentStr: String(Number((rule.percentFee * 100).toFixed(4))),
    flatStr: String(rule.flatFee),
    minStr: String(rule.minFee),
    maxStr: rule.maxFee !== null && rule.maxFee !== undefined ? String(rule.maxFee) : "",
    isActive: rule.isActive,
  };
}

function parseDraftNumbers(draft: DraftOpForm) {
  const pctNum = Math.min(100, Math.max(0, Number(draft.percentStr.replace(",", ".")) || 0));
  const flatNum = Math.max(0, Number(draft.flatStr.replace(",", ".")) || 0);
  const minNum = Math.max(0, Number(draft.minStr.replace(",", ".")) || 0);
  const maxRaw = draft.maxStr.replace(",", ".").trim();
  const maxNum = maxRaw === "" ? null : Math.max(0, Number(maxRaw) || 0);
  return {
    percentFee: Number((pctNum / 100).toFixed(6)),
    flatFee: flatNum,
    minFee: minNum,
    maxFee: maxNum,
    isActive: draft.isActive,
  };
}

function buildUserDrafts(
  workingRules: UserFeeOverrideRule[],
  scopeCurrency: string,
  fees: GlobalFeeConfig[],
  platformFeeBps: number,
): Record<FeeTransactionType, DraftOpForm> {
  const next: Record<FeeTransactionType, DraftOpForm> = {
    WITHDRAWAL: makeEmptyDraft(),
    DEPOSIT: makeEmptyDraft(),
    TRANSFER_OUT: makeEmptyDraft(),
    EXCHANGE: makeEmptyDraft(),
  };
  for (const op of OPERATIONS) {
    const match = workingRules.find(
      (r) => r.transactionType === op.type && r.currencyCode === scopeCurrency,
    );
    if (match) {
      next[op.type] = ruleToDraft(match);
    } else {
      const globalMatch = fees.find(
        (f) =>
          f.transactionType === op.type &&
          f.currencyCode.toUpperCase() === scopeCurrency.toUpperCase(),
      );
      if (globalMatch) {
        next[op.type] = ruleToDraft(globalMatch);
      } else if (op.type === "DEPOSIT" && platformFeeBps) {
        next[op.type] = {
          percentStr: String(Number((platformFeeBps / 100).toFixed(4))),
          flatStr: "0",
          minStr: "0",
          maxStr: "",
          isActive: true,
        };
      }
    }
  }
  return next;
}

function buildGlobalDrafts(
  globalCurrency: string,
  fees: GlobalFeeConfig[],
  platformFeeBps: number,
): Record<FeeTransactionType, DraftOpForm> {
  const next: Record<FeeTransactionType, DraftOpForm> = {
    WITHDRAWAL: makeEmptyDraft(),
    DEPOSIT: makeEmptyDraft(),
    TRANSFER_OUT: makeEmptyDraft(),
    EXCHANGE: makeEmptyDraft(),
  };
  for (const op of OPERATIONS) {
    const match = fees.find(
      (f) =>
        f.transactionType === op.type &&
        f.currencyCode.toUpperCase() === globalCurrency.toUpperCase(),
    );
    if (match) {
      next[op.type] = ruleToDraft(match);
    } else if (op.type === "DEPOSIT" && platformFeeBps) {
      next[op.type] = {
        percentStr: String(Number((platformFeeBps / 100).toFixed(4))),
        flatStr: "0",
        minStr: "0",
        maxStr: "",
        isActive: true,
      };
    }
  }
  return next;
}

export function AdminFeesView() {
  const [payload, setPayload] = useState<AdminFeesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"user-fees" | "global-fees">("user-fees");

  const [userSearch, setUserSearch] = useState("");
  const [onlyCustomFilter, setOnlyCustomFilter] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const [userScopeCurrency, setUserScopeCurrency] = useState<string>("*");
  const [userNote, setUserNote] = useState<string>("");
  const [workingUserRules, setWorkingUserRules] = useState<UserFeeOverrideRule[]>([]);
  const [dirtyOps, setDirtyOps] = useState<FeeTransactionType[]>([]);
  const [opDrafts, setOpDrafts] = useState<Record<FeeTransactionType, DraftOpForm>>({
    WITHDRAWAL: makeEmptyDraft(),
    DEPOSIT: makeEmptyDraft(),
    TRANSFER_OUT: makeEmptyDraft(),
    EXCHANGE: makeEmptyDraft(),
  });

  const [globalCurrency, setGlobalCurrency] = useState<string>("BRL");
  const [globalDrafts, setGlobalDrafts] = useState<Record<FeeTransactionType, DraftOpForm>>({
    WITHDRAWAL: makeEmptyDraft(),
    DEPOSIT: makeEmptyDraft(),
    TRANSFER_OUT: makeEmptyDraft(),
    EXCHANGE: makeEmptyDraft(),
  });

  const [savingUser, setSavingUser] = useState(false);
  const [savingGlobalOp, setSavingGlobalOp] = useState<FeeTransactionType | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const applyLoadedPayload = useCallback(
    (
      json: AdminFeesResponse,
      targetUserId: string,
      targetScopeCurrency: string,
      targetGlobalCurrency: string,
    ) => {
      setPayload(json);
      setErrorMsg(null);
      const chosenUser =
        json.userOverrides.find((u) => u.userId === targetUserId) ??
        json.userOverrides[0] ??
        null;
      if (chosenUser) {
        setSelectedUserId(chosenUser.userId);
        setWorkingUserRules(chosenUser.rules);
        setUserNote(chosenUser.note || "");
        setDirtyOps([]);
        setOpDrafts(
          buildUserDrafts(
            chosenUser.rules,
            targetScopeCurrency,
            json.fees,
            json.platformFeeBps,
          ),
        );
      }
      setGlobalDrafts(
        buildGlobalDrafts(targetGlobalCurrency, json.fees, json.platformFeeBps),
      );
    },
    [],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/fees", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as
        | (AdminFeesResponse & { message?: string })
        | null;
      if (res.ok && json?.ok) {
        applyLoadedPayload(json, selectedUserId, userScopeCurrency, globalCurrency);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar painel de taxas.");
      }
    } catch {
      setErrorMsg("Falha de rede ao carregar taxas administrativas.");
    } finally {
      setLoading(false);
    }
  }, [applyLoadedPayload, globalCurrency, selectedUserId, userScopeCurrency]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      try {
        const res = await fetch("/api/admin/fees", { cache: "no-store" });
        const json = (await res.json().catch(() => null)) as
          | (AdminFeesResponse & { message?: string })
          | null;
        if (cancelled) return;
        if (res.ok && json?.ok) {
          applyLoadedPayload(json, "", "*", "BRL");
        } else {
          setErrorMsg(json?.message || "Erro ao carregar painel de taxas.");
        }
      } catch {
        if (!cancelled) {
          setErrorMsg("Falha de rede ao carregar taxas administrativas.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void init();
    return () => {
      cancelled = true;
    };
  }, [applyLoadedPayload]);

  const selectedUser = useMemo(
    () => (payload?.userOverrides ?? []).find((u) => u.userId === selectedUserId) ?? null,
    [payload, selectedUserId],
  );

  function selectUser(u: UserOverrideSummary) {
    setSelectedUserId(u.userId);
    setWorkingUserRules(u.rules);
    setUserNote(u.note || "");
    setDirtyOps([]);
    setNotice(null);
    setErrorMsg(null);
    setOpDrafts(
      buildUserDrafts(
        u.rules,
        userScopeCurrency,
        payload?.fees ?? [],
        payload?.platformFeeBps ?? 90,
      ),
    );
  }

  function changeUserScopeCurrency(nextCurrency: string) {
    setUserScopeCurrency(nextCurrency);
    setDirtyOps([]);
    setOpDrafts(
      buildUserDrafts(
        workingUserRules,
        nextCurrency,
        payload?.fees ?? [],
        payload?.platformFeeBps ?? 90,
      ),
    );
  }

  function changeGlobalCurrency(nextCurrency: string) {
    setGlobalCurrency(nextCurrency);
    setGlobalDrafts(
      buildGlobalDrafts(
        nextCurrency,
        payload?.fees ?? [],
        payload?.platformFeeBps ?? 90,
      ),
    );
  }

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return (payload?.userOverrides ?? []).filter((u) => {
      if (onlyCustomFilter && u.rules.length === 0) return false;
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.userId.toLowerCase().includes(q)
      );
    });
  }, [payload, userSearch, onlyCustomFilter]);

  const customUsersCount = useMemo(
    () => (payload?.userOverrides ?? []).filter((u) => u.rules.length > 0).length,
    [payload],
  );

  const currencies = useMemo(() => payload?.currencies ?? [...XPAG_CURRENCIES], [payload]);

  function updateOpDraft(opType: FeeTransactionType, patch: Partial<DraftOpForm>) {
    setOpDrafts((prev) => ({
      ...prev,
      [opType]: { ...prev[opType], ...patch },
    }));
    setDirtyOps((prev) => (prev.includes(opType) ? prev : [...prev, opType]));
  }

  function mergeDirtyOpsIntoRules(baseRules: UserFeeOverrideRule[]): UserFeeOverrideRule[] {
    let merged = [...baseRules];
    for (const opType of dirtyOps) {
      const nums = parseDraftNumbers(opDrafts[opType]);
      merged = merged.filter(
        (r) => !(r.transactionType === opType && r.currencyCode === userScopeCurrency),
      );
      merged.push({
        transactionType: opType,
        currencyCode: userScopeCurrency,
        ...nums,
      });
    }
    return merged;
  }

  function applyDraftToWorkingRules(opType: FeeTransactionType) {
    const draft = opDrafts[opType];
    const nums = parseDraftNumbers(draft);
    setWorkingUserRules((prev) => {
      const rest = prev.filter(
        (r) => !(r.transactionType === opType && r.currencyCode === userScopeCurrency),
      );
      return [
        ...rest,
        {
          transactionType: opType,
          currencyCode: userScopeCurrency,
          ...nums,
        },
      ];
    });
    setDirtyOps((prev) => prev.filter((o) => o !== opType));
    setNotice(
      `Regra de ${OPERATIONS.find((o) => o.type === opType)?.label} (${userScopeCurrency === "*" ? "Todas as moedas" : userScopeCurrency}) adicionada ao rascunho. Clique em "Salvar Taxas do Usuário" para gravar.`,
    );
  }

  function removeWorkingRule(opType: FeeTransactionType, currencyCode: string) {
    const updatedRules = workingUserRules.filter(
      (r) => !(r.transactionType === opType && r.currencyCode === currencyCode),
    );
    setWorkingUserRules(updatedRules);
    if (currencyCode === userScopeCurrency) {
      setDirtyOps((prev) => prev.filter((o) => o !== opType));
      setOpDrafts(
        buildUserDrafts(
          updatedRules,
          userScopeCurrency,
          payload?.fees ?? [],
          payload?.platformFeeBps ?? 90,
        ),
      );
    }
  }

  async function handleSaveUserRules() {
    if (!selectedUser) return;
    setSavingUser(true);
    setNotice(null);
    setErrorMsg(null);
    const rulesToSave = mergeDirtyOpsIntoRules(workingUserRules);
    try {
      const res = await fetch("/api/admin/fees", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.userId,
          rules: rulesToSave,
          note: userNote.trim() || undefined,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) {
        setErrorMsg(json?.message || "Não foi possível salvar as taxas do usuário.");
        return;
      }
      setDirtyOps([]);
      setNotice(`Taxas personalizadas salvas com sucesso para ${selectedUser.name}.`);
      await loadData();
    } finally {
      setSavingUser(false);
    }
  }

  async function handleResetUserRules() {
    if (!selectedUser) return;
    setSavingUser(true);
    setNotice(null);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/fees", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: selectedUser.userId }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) {
        setErrorMsg(json?.message || "Erro ao restaurar taxas padrão do usuário.");
        return;
      }
      setNotice(`${selectedUser.name} voltou a usar as taxas padrão da plataforma.`);
      await loadData();
    } finally {
      setSavingUser(false);
    }
  }

  async function handleSaveGlobalRule(opType: FeeTransactionType) {
    setSavingGlobalOp(opType);
    setNotice(null);
    setErrorMsg(null);
    try {
      const nums = parseDraftNumbers(globalDrafts[opType]);
      const res = await fetch("/api/admin/fees", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transactionType: opType,
          currencyCode: globalCurrency,
          ...nums,
        }),
      });
      const json = (await res.json().catch(() => null)) as { ok?: boolean; message?: string } | null;
      if (!res.ok || !json?.ok) {
        setErrorMsg(json?.message || "Erro ao salvar taxa padrão global.");
        return;
      }
      setNotice(
        `Taxa padrão de ${OPERATIONS.find((o) => o.type === opType)?.label} para ${globalCurrency} salva no PostgreSQL.`,
      );
      await loadData();
    } finally {
      setSavingGlobalOp(null);
    }
  }

  if (loading && !payload) {
    return (
      <div className="space-y-6">
        <Card className="h-24 animate-pulse" />
        <Card className="h-96 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-5">
          <p className="text-muted-foreground text-xs">Usuários na Plataforma</p>
          <p className="text-foreground mt-1.5 text-2xl font-semibold tabular-nums">
            {payload?.userOverrides.length ?? 0}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs">Com Taxa Personalizada</p>
          <p className="text-success mt-1.5 text-2xl font-semibold tabular-nums">
            {customUsersCount}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs">Regras Globais (FeeConfig)</p>
          <p className="text-foreground mt-1.5 text-2xl font-semibold tabular-nums">
            {payload?.fees.length ?? 0}
          </p>
        </Card>
        <Card className="p-5">
          <p className="text-muted-foreground text-xs">Fallback Cash-in (bps)</p>
          <p className="text-accent mt-1.5 text-2xl font-semibold tabular-nums">
            {payload ? `${(payload.platformFeeBps / 100).toFixed(2)}%` : "0.90%"}
          </p>
        </Card>
      </div>

      {/* Mode Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="border-line bg-surface-subtle inline-flex rounded-xl border p-1">
          <button
            type="button"
            onClick={() => setActiveTab("user-fees")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              activeTab === "user-fees"
                ? "bg-accent text-accent-fg shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <UserCog className="size-3.5" />
            <span>Taxas por Usuário (inclusive Saque)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("global-fees")}
            className={cn(
              "flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-colors",
              activeTab === "global-fees"
                ? "bg-accent text-accent-fg shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Sliders className="size-3.5" />
            <span>Taxas Padrão da Plataforma</span>
          </button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadData()}
          disabled={loading}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {notice ? (
        <div className="border-success/30 bg-success-soft text-success flex items-center gap-2 rounded-xl border px-4 py-3 text-xs font-medium">
          <Check className="size-4 shrink-0" />
          <span>{notice}</span>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="border-danger/30 bg-danger-soft text-danger rounded-xl border px-4 py-3 text-xs font-medium">
          {errorMsg}
        </div>
      ) : null}

      {activeTab === "user-fees" ? (
        <div className="grid gap-5 lg:grid-cols-[330px_1fr]">
          {/* Left: User Selector List */}
          <Card className="flex flex-col overflow-hidden p-4 sm:p-5">
            <div className="space-y-3">
              <div className="relative">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2" />
                <Input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nome ou e-mail..."
                  className="pl-8 text-xs"
                />
              </div>

              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="text-muted-foreground">Somente personalizadas</span>
                <Switch
                  label="Filtrar somente usuários com taxa personalizada"
                  checked={onlyCustomFilter}
                  onCheckedChange={setOnlyCustomFilter}
                />
              </div>
            </div>

            <div className="mt-4 max-h-[540px] space-y-2 overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <p className="text-muted-foreground py-8 text-center text-xs">
                  Nenhum usuário encontrado.
                </p>
              ) : (
                filteredUsers.map((u) => {
                  const selected = u.userId === selectedUserId;
                  const hasCustom = u.rules.length > 0;
                  return (
                    <button
                      key={u.userId}
                      type="button"
                      onClick={() => selectUser(u)}
                      className={cn(
                        "flex w-full items-start justify-between gap-2 rounded-xl border p-3 text-left transition-colors",
                        selected
                          ? "border-accent/50 bg-accent-soft"
                          : "border-line bg-surface-subtle hover:bg-surface-hover",
                      )}
                    >
                      <div className="min-w-0">
                        <p className="text-foreground truncate text-xs font-semibold">
                          {u.name}
                        </p>
                        <p className="text-muted-foreground truncate text-[11px]">{u.email}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          {u.role !== "USER" ? (
                            <Badge tone="accent" className="text-[10px]">
                              {u.role}
                            </Badge>
                          ) : null}
                          <Badge
                            tone={u.kycStatus === "APPROVED" ? "success" : "neutral"}
                            className="text-[10px]"
                          >
                            KYC {u.kycStatus}
                          </Badge>
                        </div>
                      </div>
                      {hasCustom ? (
                        <Badge tone="success" className="shrink-0 text-[10px]">
                          {u.rules.length} regra{u.rules.length > 1 ? "s" : ""}
                        </Badge>
                      ) : null}
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {/* Right: Editor for Selected User */}
          {selectedUser ? (
            <div className="space-y-5">
              <Card className="p-5 sm:p-6">
                <div className="border-line flex flex-col gap-3 border-b pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="text-accent size-4" />
                      <h3 className="text-foreground text-sm font-semibold">
                        {selectedUser.name}
                      </h3>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-xs">{selectedUser.email}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetUserRules}
                      disabled={savingUser || selectedUser.rules.length === 0}
                    >
                      <RotateCcw className="size-3.5" />
                      Restaurar padrão
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleSaveUserRules}
                      disabled={savingUser}
                    >
                      <Save className="size-3.5" />
                      {savingUser ? "Salvando..." : "Salvar Taxas do Usuário"}
                    </Button>
                  </div>
                </div>

                {/* Currency Scope Selector */}
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-foreground text-xs font-medium">
                      Escopo da moeda para editar abaixo
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-[11px]">
                      Use <strong>Todas as moedas (*)</strong> como taxa geral da conta ou
                      personalize por moeda específica (ex: <strong>BRL</strong> para Pix Out).
                    </p>
                  </div>
                  <Select value={userScopeCurrency} onValueChange={changeUserScopeCurrency}>
                    <SelectTrigger className="w-full sm:w-56">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="*">* — Todas as moedas (Global)</SelectItem>
                      {currencies.map((code) => (
                        <SelectItem key={code} value={code}>
                          {code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* 4 Operation Cards */}
                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  {OPERATIONS.map((op) => {
                    const Icon = op.icon;
                    const draft = opDrafts[op.type];
                    const hasInWorking = workingUserRules.some(
                      (r) =>
                        r.transactionType === op.type &&
                        r.currencyCode === userScopeCurrency,
                    );
                    const previewNums = parseDraftNumbers(draft);
                    const sampleGross = 1000;
                    const sampleFee = previewNums.isActive
                      ? Math.min(
                          previewNums.maxFee ?? Infinity,
                          Math.max(
                            previewNums.minFee,
                            previewNums.flatFee + sampleGross * previewNums.percentFee,
                          ),
                        )
                      : 0;

                    return (
                      <div
                        key={op.type}
                        className={cn(
                          "rounded-xl border p-4",
                          op.isWithdrawal
                            ? "border-accent/40 bg-accent-soft/35"
                            : "border-line bg-surface-subtle",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                op.isWithdrawal ? "text-accent" : "text-muted-foreground",
                              )}
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-foreground text-xs font-semibold">
                                  {op.label}
                                </span>
                                {op.isWithdrawal ? (
                                  <Badge tone="accent" className="text-[10px]">
                                    Saque
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="text-muted-foreground text-[11px]">{op.hint}</p>
                            </div>
                          </div>

                          <Badge
                            tone={hasInWorking ? "success" : "neutral"}
                            className="shrink-0 text-[10px]"
                          >
                            {hasInWorking ? "Personalizada" : "Padrão"}
                          </Badge>
                        </div>

                        <div className="mt-3.5 grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">
                              Taxa (%)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={draft.percentStr}
                              onChange={(e) =>
                                updateOpDraft(op.type, { percentStr: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">
                              Taxa Fixa ({userScopeCurrency === "*" ? "moeda" : userScopeCurrency})
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.flatStr}
                              onChange={(e) =>
                                updateOpDraft(op.type, { flatStr: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">
                              Mínimo
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={draft.minStr}
                              onChange={(e) =>
                                updateOpDraft(op.type, { minStr: e.target.value })
                              }
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-muted-foreground block text-[11px]">
                              Máximo (opcional)
                            </label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              placeholder="Sem teto"
                              value={draft.maxStr}
                              onChange={(e) =>
                                updateOpDraft(op.type, { maxStr: e.target.value })
                              }
                            />
                          </div>
                        </div>

                        <div className="mt-3.5 flex items-center justify-between gap-2 text-[11px]">
                          <label className="text-foreground/80 flex items-center gap-2">
                            <Switch
                              label={`Cobrar taxa para ${op.label}`}
                              checked={draft.isActive}
                              onCheckedChange={(checked) =>
                                updateOpDraft(op.type, { isActive: checked })
                              }
                            />
                            <span>{draft.isActive ? "Cobrar taxa" : "Isento (0%)"}</span>
                          </label>
                          <span className="text-muted-foreground font-mono">
                            Ex. 1.000 → Taxa {sampleFee.toFixed(2)}
                          </span>
                        </div>

                        <div className="mt-3.5 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="flex-1 text-xs"
                            onClick={() => applyDraftToWorkingRules(op.type)}
                          >
                            <Percent className="size-3.5" />
                            {hasInWorking ? "Atualizar no rascunho" : "Personalizar regra"}
                          </Button>
                          {hasInWorking ? (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                removeWorkingRule(op.type, userScopeCurrency)
                              }
                              title="Remover esta regra personalizada"
                            >
                              <Trash2 className="text-danger size-3.5" />
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Working Rules Summary */}
                <div className="border-line mt-5 space-y-3 border-t pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="text-foreground text-xs font-semibold">
                      Regras personalizadas no rascunho ({workingUserRules.length})
                    </h4>
                    <span className="text-muted-foreground text-[11px]">
                      Lembre-se de clicar em &ldquo;Salvar Taxas do Usuário&rdquo; após editar.
                    </span>
                  </div>

                  {workingUserRules.length === 0 ? (
                    <p className="border-line text-muted-foreground rounded-lg border border-dashed p-3.5 text-xs">
                      Este usuário utiliza 100% as taxas padrão da plataforma. Clique em
                      &ldquo;Personalizar regra&rdquo; em qualquer card acima para definir
                      taxas exclusivas (como taxa de saque).
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {workingUserRules.map((r) => {
                        const opMeta = OPERATIONS.find((o) => o.type === r.transactionType);
                        return (
                          <div
                            key={`${r.transactionType}:${r.currencyCode}`}
                            className="border-line bg-surface-subtle flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs"
                          >
                            <span className="text-foreground font-semibold">
                              {opMeta?.label ?? r.transactionType}
                            </span>
                            <Badge tone="accent" className="text-[10px]">
                              {r.currencyCode === "*" ? "Todas (*)" : r.currencyCode}
                            </Badge>
                            <span className="text-success font-mono font-medium">
                              {r.isActive
                                ? `${(r.percentFee * 100).toFixed(2)}% + ${r.flatFee}`
                                : "Isento (0%)"}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                removeWorkingRule(r.transactionType, r.currencyCode)
                              }
                              className="text-muted-foreground hover:text-danger ml-1"
                              aria-label="Remover regra"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2">
                    <label className="text-muted-foreground block text-xs font-medium">
                      Observação comercial (exibida para o usuário em /fees)
                    </label>
                    <Input
                      value={userNote}
                      onChange={(e) => setUserNote(e.target.value)}
                      placeholder="Ex: Plano Enterprise · Saque Pix reduzido para 0,5%"
                      maxLength={240}
                    />
                  </div>
                </div>
              </Card>
            </div>
          ) : null}
        </div>
      ) : (
        /* Global FeeConfig Tab */
        <Card className="space-y-5 p-5 sm:p-6">
          <div className="border-line flex flex-col gap-4 border-b pb-5">
            <div>
              <h3 className="text-foreground text-sm font-semibold">
                Taxas Padrão por Moeda (FeeConfig Global)
              </h3>
              <p className="text-muted-foreground mt-0.5 text-xs">
                Aplicadas a todos os usuários que não possuem regra personalizada naquela operação.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {[...currencies, "*"].map((code) => {
                const active = code === globalCurrency;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => changeGlobalCurrency(code)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-semibold transition-colors",
                      active
                        ? "border-accent/50 bg-accent-soft text-foreground shadow-xs"
                        : "border-line bg-surface-subtle text-muted-foreground hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    {isXPagCurrency(code) ? (
                      <CurrencyIcon
                        currency={code}
                        className="size-6 rounded-lg border-0 bg-transparent shadow-none"
                      />
                    ) : null}
                    <span>{code === "*" ? "Global (*)" : code}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {OPERATIONS.map((op) => {
              const Icon = op.icon;
              const draft = globalDrafts[op.type];
              const isSaving = savingGlobalOp === op.type;
              const hasSavedRow = (payload?.fees ?? []).some(
                (f) =>
                  f.transactionType === op.type &&
                  f.currencyCode.toUpperCase() === globalCurrency.toUpperCase(),
              );

              return (
                <div
                  key={op.type}
                  className={cn(
                    "rounded-xl border p-4",
                    op.isWithdrawal
                      ? "border-accent/40 bg-accent-soft/35"
                      : "border-line bg-surface-subtle",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Icon
                        className={cn(
                          "size-4 shrink-0",
                          op.isWithdrawal ? "text-accent" : "text-muted-foreground",
                        )}
                      />
                      <div>
                        <h4 className="text-foreground text-xs font-semibold">
                          {op.label} · {globalCurrency === "*" ? "Global (*)" : globalCurrency}
                        </h4>
                        <p className="text-muted-foreground text-[11px]">{op.hint}</p>
                      </div>
                    </div>
                    <Badge tone={hasSavedRow ? "success" : "neutral"} className="text-[10px]">
                      {hasSavedRow ? "Configurada" : "Não definida"}
                    </Badge>
                  </div>

                  <div className="mt-3.5 grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-muted-foreground block text-[11px]">Taxa (%)</label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={draft.percentStr}
                        onChange={(e) =>
                          setGlobalDrafts((prev) => ({
                            ...prev,
                            [op.type]: { ...prev[op.type], percentStr: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground block text-[11px]">
                        Taxa Fixa
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.flatStr}
                        onChange={(e) =>
                          setGlobalDrafts((prev) => ({
                            ...prev,
                            [op.type]: { ...prev[op.type], flatStr: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground block text-[11px]">Mínimo</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={draft.minStr}
                        onChange={(e) =>
                          setGlobalDrafts((prev) => ({
                            ...prev,
                            [op.type]: { ...prev[op.type], minStr: e.target.value },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-muted-foreground block text-[11px]">
                        Máximo (opcional)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Sem teto"
                        value={draft.maxStr}
                        onChange={(e) =>
                          setGlobalDrafts((prev) => ({
                            ...prev,
                            [op.type]: { ...prev[op.type], maxStr: e.target.value },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-2">
                    <label className="text-foreground/80 flex items-center gap-2 text-xs">
                      <Switch
                        label={`Ativar regra global para ${op.label}`}
                        checked={draft.isActive}
                        onCheckedChange={(checked) =>
                          setGlobalDrafts((prev) => ({
                            ...prev,
                            [op.type]: { ...prev[op.type], isActive: checked },
                          }))
                        }
                      />
                      <span>{draft.isActive ? "Regra ativa" : "Inativa (0%)"}</span>
                    </label>

                    <Button
                      type="button"
                      size="sm"
                      disabled={isSaving}
                      onClick={() => void handleSaveGlobalRule(op.type)}
                    >
                      <Save className="size-3.5" />
                      {isSaving ? "Salvando..." : "Salvar Padrão"}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}
