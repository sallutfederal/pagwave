"use client";

import { Copy, EyeOff, Snowflake, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function CardMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="onDark"
          size="icon"
          aria-label="Card options"
          className="size-8 bg-transparent hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-current">
            <circle cx="12" cy="5" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="12" cy="19" r="1.6" />
          </svg>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem>
          <EyeOff /> Hide card number
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy /> Copy number
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Snowflake /> Freeze card
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-danger hover:text-danger">
          <Trash2 /> Remove card
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function VisaMark() {
  return (
    <span className="text-[19px] leading-none font-extrabold tracking-tight italic text-white">
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

export function CardBrandMark({ brand, className }: { brand: "visa" | "mastercard"; className?: string }) {
  return (
    <span className={cn("flex items-center", className)}>
      {brand === "visa" ? <VisaMark /> : <MastercardMark />}
    </span>
  );
}