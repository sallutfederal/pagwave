import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "bg-surface border-line rounded-card shadow-card border backdrop-blur-xl",
        className,
      )}
      {...props}
    />
  );
}