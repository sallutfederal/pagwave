"use client";

import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordStrengthProps {
  password?: string;
}

export function AuthPasswordStrength({ password = "" }: PasswordStrengthProps) {
  if (!password) return null;

  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const score = [hasLength, hasUpper, hasNumber, hasSpecial].filter(Boolean).length;

  const strengthLabels = ["Weak", "Fair", "Good", "Bank-Grade Strong"];
  const strengthColors = [
    "bg-rose-500",
    "bg-amber-500",
    "bg-lh-accent",
    "bg-emerald-400 shadow-sm shadow-emerald-400/50",
  ];

  return (
    <div className="mt-2 space-y-2 text-xs">
      {/* 4 segment bars */}
      <div className="flex items-center gap-1.5">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              index < score ? strengthColors[score - 1] : "bg-white/10"
            )}
          />
        ))}
        <span
          className={cn(
            "ml-2 text-[11px] font-mono font-medium transition-colors",
            score <= 1
              ? "text-rose-400"
              : score === 2
              ? "text-amber-400"
              : score === 3
              ? "text-lh-accent"
              : "text-emerald-400"
          )}
        >
          {score > 0 ? strengthLabels[score - 1] : "Too short"}
        </span>
      </div>

      {/* Criteria pills */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
        <div
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            hasLength ? "text-emerald-400" : "text-lh-muted"
          )}
        >
          {hasLength ? <Check className="size-3" /> : <div className="size-1.5 rounded-full bg-white/20 mx-0.5" />}
          <span>8+ characters</span>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            hasUpper ? "text-emerald-400" : "text-lh-muted"
          )}
        >
          {hasUpper ? <Check className="size-3" /> : <div className="size-1.5 rounded-full bg-white/20 mx-0.5" />}
          <span>Uppercase letter</span>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            hasNumber ? "text-emerald-400" : "text-lh-muted"
          )}
        >
          {hasNumber ? <Check className="size-3" /> : <div className="size-1.5 rounded-full bg-white/20 mx-0.5" />}
          <span>Number (0-9)</span>
        </div>

        <div
          className={cn(
            "flex items-center gap-1.5 transition-colors",
            hasSpecial ? "text-emerald-400" : "text-lh-muted"
          )}
        >
          {hasSpecial ? <Check className="size-3" /> : <div className="size-1.5 rounded-full bg-white/20 mx-0.5" />}
          <span>Special symbol (!@#)</span>
        </div>
      </div>
    </div>
  );
}
