"use client";

import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Receipt, Send, type LucideIcon } from "lucide-react";

import { useI18n } from "@/components/locale-provider";
import type { QuickAction } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const icons: Record<QuickAction["id"], LucideIcon> = {
  transfer: Send,
  utility: ArrowDownLeft,
  taxes: Receipt,
  transport: ArrowUpRight,
};

const actionHref: Record<QuickAction["id"], string> = {
  transfer: "/wallet?tab=transfer",
  utility: "/wallet?tab=cashin",
  taxes: "/transactions",
  transport: "/wallet?tab=cashout",
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const { messages } = useI18n();

  const labelFor = (id: QuickAction["id"], fallback: string) => {
    switch (id) {
      case "transfer":
        return messages.dashboard.actionTransfer;
      case "utility":
        return messages.dashboard.actionDeposit;
      case "transport":
        return messages.dashboard.actionWithdraw;
      case "taxes":
        return messages.dashboard.actionStatement;
      default:
        return fallback;
    }
  };

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => {
        const Icon = icons[action.id];
        const active = action.active;

        return (
          <Link
            key={action.id}
            href={actionHref[action.id]}
            className={cn(
              "flex items-center gap-2.5 rounded-full border py-2 pr-4 pl-2 text-left transition-all duration-300 hover:-translate-y-0.5",
              active
                ? "border-accent bg-accent text-accent-fg shadow-[0_10px_28px_-10px_rgba(255,255,255,0.28)]"
                : "border-line bg-surface text-foreground shadow-card backdrop-blur-xl hover:border-foreground/25 hover:bg-surface-hover",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                active ? "bg-accent-fg/12 text-accent-fg" : "bg-surface-subtle text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.9} />
            </span>
            <span className="truncate text-[13px] font-medium">
              {labelFor(action.id, action.label)}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
