"use client";

import { Bus, Landmark, Receipt, Send, type LucideIcon } from "lucide-react";

import type { QuickAction } from "@/lib/schemas";
import { cn } from "@/lib/utils";

const icons: Record<QuickAction["id"], LucideIcon> = {
  transfer: Send,
  utility: Landmark,
  taxes: Receipt,
  transport: Bus,
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {actions.map((action) => {
        const Icon = icons[action.id];
        const active = action.active;

        return (
          <button
            key={action.id}
            type="button"
            aria-pressed={active}
            className={cn(
              "flex items-center gap-2.5 rounded-full py-2 pr-4 pl-2 text-left transition-all duration-300 hover:-translate-y-0.5",
              active
                ? "bg-accent text-accent-fg shadow-[0_8px_20px_-10px_rgb(59_130_246/0.9)]"
                : "bg-surface text-foreground shadow-card hover:bg-surface-hover",
            )}
          >
            <span
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-full transition-colors",
                active ? "bg-white/20 text-white" : "bg-surface-subtle text-foreground",
              )}
            >
              <Icon className="size-4" strokeWidth={1.9} />
            </span>
            <span className="truncate text-[13px] font-medium">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}