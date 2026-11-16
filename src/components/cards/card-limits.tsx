"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { formatCurrency, formatDate } from "@/lib/format";
import type { BankCard, CardSetting } from "@/lib/schemas";

function limitTone(percent: number) {
  if (percent >= 90) return "danger" as const;
  if (percent >= 70) return "warning" as const;
  return "accent" as const;
}

function LimitRow({
  card,
  settings,
  forceExpanded = false,
}: {
  card: BankCard;
  settings: CardSetting;
  forceExpanded?: boolean;
}) {
  const router = useRouter();
  const [frozen, setFrozen] = useState(settings.frozen);
  const [editing, setEditing] = useState(false);
  const [limitInput, setLimitInput] = useState(String(settings.monthlyLimit));
  const [pending, setPending] = useState(false);
  const [savingLimit, setSavingLimit] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedOk, setSavedOk] = useState(false);

  const percent =
    settings.monthlyLimit > 0 ? (settings.spent / settings.monthlyLimit) * 100 : 0;

  async function toggleFrozen(next: boolean) {
    const previous = frozen;
    setFrozen(next);
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cards/${card.id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frozen: next }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setFrozen(previous);
        setError(payload?.message ?? "Could not update the card.");
        return;
      }

      router.refresh();
    } catch {
      setFrozen(previous);
      setError("Network error. Try again.");
    } finally {
      setPending(false);
    }
  }

  async function saveLimit(e: React.FormEvent) {
    e.preventDefault();
    const numeric = Number(limitInput);
    if (!Number.isFinite(numeric) || numeric < 0) {
      setError("Informe um limite mensal válido.");
      return;
    }

    setSavingLimit(true);
    setError(null);
    setSavedOk(false);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monthlyLimit: numeric }),
      });
      if (!res.ok) {
        const payload = (await res.json().catch(() => null)) as {
          message?: string;
        } | null;
        setError(payload?.message ?? "Não foi possível atualizar o limite.");
        return;
      }
      setSavedOk(true);
      setEditing(false);
      router.refresh();
    } catch {
      setError("Erro de rede ao salvar limite.");
    } finally {
      setSavingLimit(false);
    }
  }

  const showEditor = editing || forceExpanded;

  return (
    <div className="border-line border-b py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-foreground text-sm font-medium">{settings.label}</p>
            <Badge tone="neutral" className="font-mono">
              ••{card.last4}
            </Badge>
            {frozen ? <Badge tone="warning">Frozen</Badge> : null}
            {savedOk ? <Badge tone="success">Limite atualizado</Badge> : null}
          </div>

          <Progress
            value={settings.spent}
            max={settings.monthlyLimit}
            tone={limitTone(percent)}
            label={`${settings.label} spend`}
          />

          <p className="text-muted-foreground text-xs">
            <span className="text-foreground font-semibold tabular-nums">
              {formatCurrency({ amount: settings.spent, currency: card.currency })}
            </span>{" "}
            spent of{" "}
            <span className="tabular-nums">
              {formatCurrency({ amount: settings.monthlyLimit, currency: card.currency })}
            </span>{" "}
            · {settings.transactions} transactions · linked {formatDate(settings.linkedAt)}
          </p>

          {error ? (
            <p role="alert" className="text-danger text-[11px]">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-xs">{frozen ? "Frozen" : "Active"}</span>
          <Switch
            checked={frozen}
            onCheckedChange={(next) => void toggleFrozen(next)}
            disabled={pending}
            label={`Freeze ${settings.label}`}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setEditing((v) => !v)}
          >
            {showEditor ? "Close" : "Manage"}
          </Button>
        </div>
      </div>

      {showEditor ? (
        <form
          onSubmit={saveLimit}
          className="border-line bg-surface-subtle mt-3 flex flex-wrap items-end gap-3 rounded-xl border p-3"
        >
          <div className="min-w-44 flex-1">
            <label className="text-muted-foreground mb-1 block text-[11px]">
              Monthly spending limit ({card.currency})
            </label>
            <Input
              type="number"
              min={0}
              step="100"
              value={limitInput}
              onChange={(e) => setLimitInput(e.target.value)}
              className="h-9 font-mono text-xs"
            />
          </div>
          <Button type="submit" size="sm" disabled={savingLimit}>
            {savingLimit ? "Saving..." : "Save limit"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

export function CardLimits({
  cards,
  settings,
}: {
  cards: BankCard[];
  settings: CardSetting[];
}) {
  const [expandAll, setExpandAll] = useState(false);

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-[15px] font-semibold">Spending limits</h2>
        {cards.length > 0 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpandAll((v) => !v)}
          >
            {expandAll ? "Collapse all" : "Adjust all"}
          </Button>
        ) : null}
      </div>

      {cards.length === 0 ? (
        <p className="text-muted-foreground py-6 text-center text-xs">
          No active cards yet. Request a virtual card above to manage spending limits.
        </p>
      ) : (
        cards.map((card) => {
          const row = settings.find((item) => item.cardId === card.id);
          return row ? (
            <LimitRow
              key={card.id}
              card={card}
              settings={row}
              forceExpanded={expandAll}
            />
          ) : null;
        })
      )}
    </Card>
  );
}
