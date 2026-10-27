"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { useHydrated } from "@/lib/use-hydrated";

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const isDark = resolvedTheme === "dark";

  // Both the label and the icon wait for hydration: `resolvedTheme` is unknown
  // on the server, and rendering the dark branch there is a hydration mismatch.
  const label = hydrated
    ? isDark
      ? "Switch to light theme"
      : "Switch to dark theme"
    : "Toggle theme";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={label}
      className={cn(
        "bg-surface text-muted-foreground hover:text-foreground border-line grid size-10 place-items-center rounded-full border transition-colors",
        className,
      )}
    >
      {hydrated && (isDark ? <Sun className="size-4" /> : <Moon className="size-4" />)}
    </button>
  );
}