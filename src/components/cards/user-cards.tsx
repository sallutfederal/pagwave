"use client";

import { Trash2 } from "lucide-react";

import { BankCardTile } from "@/components/dashboard/bank-card";
import { Button } from "@/components/ui/button";
import { removeUserCard, useUserCards } from "@/lib/card-store";

/** Cards the user created on this device, with a remove action. */
export function UserCards() {
  const cards = useUserCards();

  if (cards.length === 0) return null;

  return (
    <>
      {cards.map((card) => (
        <div key={card.id} className="group/card relative">
          <BankCardTile card={card} />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeUserCard(card.id)}
            className="text-muted-foreground hover:text-danger absolute -bottom-1 right-1 opacity-0 transition-opacity group-hover/card:opacity-100 focus-visible:opacity-100"
          >
            <Trash2 /> Remove
          </Button>
        </div>
      ))}
    </>
  );
}