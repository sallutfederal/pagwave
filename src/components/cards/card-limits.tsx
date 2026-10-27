"use client";

import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
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
}: {
  card: BankCard;
  settings: CardSetting;
}) {
  const [frozen, setFrozen] = useState(settings.frozen);
  const percent = settings.monthlyLimit > 0 ? (settings.spent / settings.monthlyLimit) * 100 : 0;

  return (
    <div className="border-line flex flex-wrap items-center gap-4 border-b py-4 last:border-b-0 last:pb-0 first:pt-0">
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground text-sm font-medium">{settings.label}</p>
          <Badge tone="neutral" className="font-mono">
            ••{card.last4}
          </Badge>
          {frozen ? <Badge tone="warning">Frozen</Badge> : null}
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
      </div>

      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs">{frozen ? "Frozen" : "Active"}</span>
        <Switch checked={frozen} onCheckedChange={setFrozen} label={`Freeze ${settings.label}`} />
        <Button variant="outline" size="sm">
          Manage
        </Button>
      </div>
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
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-foreground text-[15px] font-semibold">Spending limits</h2>
        <Button variant="ghost" size="sm">
          Adjust all
        </Button>
      </div>

      {cards.map((card) => {
        const row = settings.find((item) => item.cardId === card.id);
        return row ? <LimitRow key={card.id} card={card} settings={row} /> : null;
      })}
    </Card>
  );
}