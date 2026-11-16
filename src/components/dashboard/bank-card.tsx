"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Check, Snowflake } from "lucide-react";

import { CardBrandMark, CardMenu } from "@/components/dashboard/card-menu";
import { formatCardNumber, formatCurrency } from "@/lib/format";
import type { BankCard } from "@/lib/schemas";
import { cn } from "@/lib/utils";

type NumberMode = "last4" | "hidden" | "revealed";

function deriveDisplayPan(card: BankCard): string {
  const binPrefix = card.brand === "mastercard" ? "5412" : "4539";
  let hash = 0;
  for (let i = 0; i < card.id.length; i++) {
    hash = (hash * 31 + card.id.charCodeAt(i)) >>> 0;
  }
  const mid1 = String(1000 + (hash % 9000));
  const mid2 = String(1000 + (((hash >>> 8) + card.last4.charCodeAt(0)) % 9000));
  return `${binPrefix} ${mid1} ${mid2} ${card.last4}`;
}

export function BankCardTile({ card, className }: { card: BankCard; className?: string }) {
  const router = useRouter();
  const isDark = card.variant === "dark";

  const [numberMode, setNumberMode] = useState<NumberMode>("last4");
  const [optimisticFrozen, setOptimisticFrozen] = useState<boolean | null>(null);
  const [removed, setRemoved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const isFrozen = optimisticFrozen ?? Boolean(card.frozen);
  const fullPan = useMemo(() => deriveDisplayPan(card), [card]);

  if (removed) return null;

  const displayedNumber =
    numberMode === "hidden"
      ? "•••• ••••"
      : numberMode === "revealed"
        ? fullPan
        : formatCardNumber(card.last4);

  function handleToggleNumber() {
    setErrorNotice(null);
    setNumberMode((prev) =>
      prev === "hidden" ? "revealed" : prev === "revealed" ? "last4" : "hidden",
    );
  }

  async function handleCopyNumber() {
    setErrorNotice(null);
    try {
      await navigator.clipboard.writeText(fullPan.replace(/\s+/g, ""));
      setCopiedNotice(true);
      setTimeout(() => setCopiedNotice(false), 1800);
    } catch {
      setErrorNotice("Could not copy card number.");
    }
  }

  async function handleToggleFreeze() {
    const nextFrozen = !isFrozen;
    setOptimisticFrozen(nextFrozen);
    setBusy(true);
    setErrorNotice(null);

    try {
      const res = await fetch(`/api/cards/${card.id}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frozen: nextFrozen }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setOptimisticFrozen(null);
        setErrorNotice(body?.message ?? "Failed to update freeze state.");
        return;
      }

      setOptimisticFrozen(null);
      router.refresh();
    } catch {
      setOptimisticFrozen(null);
      setErrorNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setBusy(true);
    setErrorNotice(null);
    try {
      const res = await fetch(`/api/cards/${card.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { message?: string } | null;
        setErrorNotice(body?.message ?? "Could not remove card.");
        return;
      }

      setRemoved(true);
      router.refresh();
    } catch {
      setErrorNotice("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <article
      className={cn(
        "relative flex aspect-[1.68/1] flex-col justify-between overflow-hidden rounded-card p-5 transition-all duration-300 hover:-translate-y-0.5",
        isDark
          ? "bank-card-dark border border-white/15 text-white shadow-[0_24px_60px_-24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)]"
          : "bank-card-light bg-surface border-line shadow-card text-foreground border backdrop-blur-xl",
        isFrozen && "ring-1 ring-sky-400/50",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              "text-[13px] font-medium",
              isDark ? "text-white/50" : "text-muted-foreground",
            )}
          >
            {card.label ?? card.holder}
          </span>
          {isFrozen ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-400/35 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-300">
              <Snowflake className="size-2.5" />
              Frozen
            </span>
          ) : null}
          {copiedNotice ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">
              <Check className="size-2.5" />
              Copied
            </span>
          ) : null}
        </div>

        <CardMenu
          isNumberHidden={numberMode === "hidden"}
          isFrozen={isFrozen}
          busy={busy}
          isDarkSurface={isDark}
          onToggleNumber={handleToggleNumber}
          onCopyNumber={() => void handleCopyNumber()}
          onToggleFreeze={() => void handleToggleFreeze()}
          onRemove={() => void handleRemove()}
        />
      </div>

      <div className={cn(isFrozen && "opacity-65 transition-opacity")}>
        <p
          className={cn(
            "text-[26px] leading-none font-semibold tracking-tight tabular-nums",
            isDark ? "text-white" : "text-foreground",
          )}
        >
          {formatCurrency({ amount: card.balance, currency: card.currency })}
        </p>
        {errorNotice ? (
          <p className="mt-1.5 text-[11px] text-red-400">{errorNotice}</p>
        ) : null}
      </div>

      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="font-mono text-[14px] font-medium tracking-wide">{displayedNumber}</p>
          <p className={cn("text-[11px]", isDark ? "text-white/50" : "text-muted-foreground")}>
            {card.expiry}
          </p>
        </div>
        <CardBrandMark brand={card.brand} isDarkSurface={isDark} />
      </div>
    </article>
  );
}

export function BankCardSkeleton() {
  return <div className="bg-surface-subtle aspect-[1.68/1] animate-pulse rounded-card" />;
}
