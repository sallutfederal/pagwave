import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/lib/utils";

export function AuthField({
  label,
  htmlFor,
  error,
  right,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={htmlFor} className="text-xs font-medium text-lh-muted">
          {label}
        </label>
        {right}
      </div>
      {children}
      {error ? (
        <p role="alert" className="text-[11px] text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthInput({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 text-sm text-white placeholder:text-white/35 outline-none transition",
        "focus:border-lh-accent focus:bg-white/[0.07] focus:ring-2 focus:ring-lh-accent/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function AuthAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const styles =
    tone === "success"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
      : tone === "info"
        ? "border-lh-accent/30 bg-lh-accent/10 text-blue-200"
        : "border-rose-500/30 bg-rose-500/10 text-rose-300";

  return (
    <div role="alert" className={cn("rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed", styles)}>
      {children}
    </div>
  );
}
