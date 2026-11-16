"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Snowflake } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BankCard } from "@/lib/schemas";

export function FreezeAllButton({ cards }: { cards: BankCard[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  const hasCards = cards.length > 0;
  const allFrozen = hasCards && cards.every((c) => Boolean(c.frozen));
  const targetFrozen = !allFrozen;

  async function handleFreezeAll() {
    if (!hasCards) return;
    setPending(true);
    try {
      const candidates = cards.filter((c) => Boolean(c.frozen) !== targetFrozen);
      await Promise.allSettled(
        candidates.map((card) =>
          fetch(`/api/cards/${card.id}/freeze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ frozen: targetFrozen }),
          }),
        ),
      );
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      variant="outline"
      disabled={!hasCards || pending}
      onClick={() => void handleFreezeAll()}
    >
      <Snowflake />
      {pending ? "Updating..." : allFrozen ? "Unfreeze all" : "Freeze all"}
    </Button>
  );
}

