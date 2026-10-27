import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "bg-surface-subtle text-foreground placeholder:text-subtle-foreground h-10 w-full rounded-xl px-3.5 text-sm outline-none transition-[background-color,box-shadow]",
        "focus:bg-surface focus:ring-2 focus:ring-accent/20",
        className,
      )}
      {...props}
    />
  );
}