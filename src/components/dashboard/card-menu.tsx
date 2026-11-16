"use client";

import { useState } from "react";
import { Copy, Eye, EyeOff, Snowflake, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CardMenuProps = {
  isNumberHidden: boolean;
  isFrozen: boolean;
  busy?: boolean;
  isDarkSurface?: boolean;
  onToggleNumber: () => void;
  onCopyNumber: () => void;
  onToggleFreeze: () => void;
  onRemove: () => void;
};

export function CardMenu({
  isNumberHidden,
  isFrozen,
  busy = false,
  isDarkSurface = true,
  onToggleNumber,
  onCopyNumber,
  onToggleFreeze,
  onRemove,
}: CardMenuProps) {
  const [confirmRemove, setConfirmRemove] = useState(false);

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) setConfirmRemove(false);
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="onDark"
          size="icon"
          aria-label="Card options"
          className={cn(
            "size-8 bg-transparent",
            isDarkSurface
              ? "text-white hover:bg-white/10"
              : "text-foreground hover:bg-surface-hover",
          )}
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem disabled={busy} onSelect={onToggleNumber}>
          {isNumberHidden ? <Eye /> : <EyeOff />}
          {isNumberHidden ? "Show card number" : "Hide card number"}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={onCopyNumber}>
          <Copy /> Copy number
        </DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={onToggleFreeze}>
          <Snowflake /> {isFrozen ? "Unfreeze card" : "Freeze card"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={busy}
          onSelect={(event) => {
            if (!confirmRemove) {
              event.preventDefault();
              setConfirmRemove(true);
              return;
            }
            setConfirmRemove(false);
            onRemove();
          }}
          className="text-danger hover:text-danger focus:text-danger"
        >
          <Trash2 />
          {confirmRemove ? "Click again to remove" : "Remove card"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function VisaMark({ isDarkSurface = true }: { isDarkSurface?: boolean }) {
  return (
    <span
      className={cn(
        "text-[19px] leading-none font-extrabold tracking-tight italic",
        isDarkSurface ? "text-white" : "text-foreground",
      )}
    >
      VISA
    </span>
  );
}

function MastercardMark({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-5 w-9 items-center", className)}>
      <span className="absolute left-0 size-5 rounded-full bg-[#1f2937] dark:bg-[#cbd5e1]" />
      <span className="absolute left-2.5 size-5 rounded-full bg-[#0b1220]/80 ring-2 ring-white dark:bg-[#94a3b8]/80 dark:ring-[#141922]" />
    </span>
  );
}

export function CardBrandMark({
  brand,
  isDarkSurface = true,
  className,
}: {
  brand: "visa" | "mastercard";
  isDarkSurface?: boolean;
  className?: string;
}) {
  return (
    <span className={cn("flex items-center", className)}>
      {brand === "visa" ? (
        <VisaMark isDarkSurface={isDarkSurface} />
      ) : (
        <MastercardMark />
      )}
    </span>
  );
}
