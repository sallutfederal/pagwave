import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "bg-surface-subtle border-line text-foreground placeholder:text-subtle-foreground h-10 w-full rounded-xl border px-3.5 text-sm backdrop-blur-md outline-none transition-[background-color,border-color,box-shadow]",
        "focus:border-foreground/30 focus:bg-surface",
        className,
      )}
      {...props}
    />
  );
}