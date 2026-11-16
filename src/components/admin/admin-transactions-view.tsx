"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, ShieldAlert } from "lucide-react";
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
import { cn } from "@/lib/utils";

type GlobalActivityRow = {
  id: string;
  userId: string;
  ownerEmail: string;
  ownerName: string;
  kind: string;
  currency: string;
  toCurrency?: string;
  amount?: number;
  rail?: string;
  status: string;
  externalId?: string;
  transactionId?: string;
  requestNumber?: string;
  e2e?: string;
  origin?: string;
  createdAt: string;
};

const ADMIN_STATUS_OPTIONS = [
  "pending",
  "processing",
  "completed",
  "paid",
  "failed",
  "expired",
  "med_blocked",
  "med_closed",
];

export function AdminTransactionsView() {
  const [activities, setActivities] = useState<GlobalActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("ALL");
  const [onlyMed, setOnlyMed] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/admin/transactions", { cache: "no-store" });
      const json = (await res.json().catch(() => null)) as {
        ok?: boolean;
        activities?: GlobalActivityRow[];
        message?: string;
      } | null;
      if (cancelled) return;
      if (res.ok && json?.ok && json.activities) {
        setActivities(json.activities);
        setErrorMsg(null);
      } else {
        setErrorMsg(json?.message || "Erro ao carregar transações globais.");
      }
      setLoading(false);
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [refreshTick]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (onlyMed && a.status !== "med_blocked" && a.status !== "med_closed") {
        return false;
      }
      if (kindFilter !== "ALL" && a.kind !== kindFilter) return false;
      if (!q) return true;
      return (
        a.ownerEmail.toLowerCase().includes(q) ||
        a.currency.toLowerCase().includes(q) ||
        (a.e2e ?? "").toLowerCase().includes(q) ||
        (a.externalId ?? "").toLowerCase().includes(q) ||
        (a.requestNumber ?? "").toLowerCase().includes(q) ||
        (a.transactionId ?? "").toLowerCase().includes(q)
      );
    });
  }, [activities, query, kindFilter, onlyMed]);

  const handleStatusChange = async (activityId: string, status: string) => {
    setBusyId(activityId);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/admin/transactions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityId, status }),
      });
      const json = (await res.json()) as { ok?: boolean; message?: string };
      if (!res.ok || !json.ok) {
        setErrorMsg(json.message || "Falha ao atualizar status da transação.");
        return;
      }
      setRefreshTick((t) => t + 1);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <div className="relative min-w-60 flex-1 max-w-sm">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por e-mail, moeda, e2e ou request_number"
              className="bg-surface-subtle border-line text-foreground h-10 rounded-full pl-10 text-xs"
            />
          </div>

          <Select value={kindFilter} onValueChange={setKindFilter}>
            <SelectTrigger className="bg-surface-subtle border-line h-10 w-36 rounded-full px-3.5 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos tipos</SelectItem>
              <SelectItem value="cashin">Cash-in</SelectItem>
              <SelectItem value="cashout">Cash-out</SelectItem>
              <SelectItem value="conversion">Conversão FX</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant={onlyMed ? "default" : "outline"}
            size="sm"
            onClick={() => setOnlyMed((v) => !v)}
          >
            <ShieldAlert className="size-3.5" />
            Somente MED ({activities.filter((a) => a.status.startsWith("med")).length})
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLoading(true);
            setRefreshTick((t) => t + 1);
          }}
        >
          <RefreshCw className={cn("size-3.5", loading && "animate-spin")} />
          Atualizar
        </Button>
      </div>

      {errorMsg ? (
        <Card className="border-red-500/30 bg-red-500/10 p-4 text-xs text-red-200">
          {errorMsg}
        </Card>
      ) : null}

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-muted-foreground border-b border-white/10 bg-surface-subtle">
                <th className="px-4 py-3 font-medium">Conta</th>
                <th className="px-4 py-3 font-medium">Operação / Moeda</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Identificadores</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-4 py-8 text-center">
                    {loading
                      ? "Carregando transações..."
                      : "Nenhuma movimentação corresponde aos filtros."}
                  </td>
                </tr>
              ) : (
                filtered.map((act) => (
                  <tr key={act.id} className="hover:bg-surface-subtle/50">
                    <td className="px-4 py-3">
                      <p className="text-foreground font-medium">{act.ownerName}</p>
                      <p className="text-muted-foreground text-[11px]">{act.ownerEmail}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                          act.kind === "cashin"
                            ? "bg-emerald-500/15 text-emerald-300"
                            : act.kind === "cashout"
                              ? "bg-amber-500/15 text-amber-300"
                              : "bg-sky-500/15 text-sky-300",
                        )}
                      >
                        {act.kind}
                      </span>
                      <p className="text-foreground mt-1 font-mono font-semibold">
                        {act.currency}
                        {act.toCurrency ? ` → ${act.toCurrency}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-3 font-mono text-foreground">
                      {typeof act.amount === "number" ? act.amount : "Valor aberto"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      <p className="truncate max-w-52">
                        ext: {act.externalId || "—"}
                      </p>
                      <p className="truncate max-w-52">
                        req: {act.requestNumber || act.transactionId || "—"}
                      </p>
                      {act.e2e ? <p className="truncate max-w-52">e2e: {act.e2e}</p> : null}
                    </td>
                    <td className="px-4 py-3">
                      <Select
                        value={act.status}
                        disabled={busyId === act.id}
                        onValueChange={(next) => handleStatusChange(act.id, next)}
                      >
                        <SelectTrigger className="bg-surface-subtle border-line h-8 w-36 rounded-lg px-2.5 font-mono text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ADMIN_STATUS_OPTIONS.map((st) => (
                            <SelectItem key={st} value={st}>
                              {st}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-4 py-3 text-[11px] text-muted-foreground">
                      {new Date(act.createdAt).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

