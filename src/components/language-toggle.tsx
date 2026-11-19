"use client";

import { Check, Globe } from "lucide-react";

import { useI18n } from "@/components/locale-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LOCALE_OPTIONS } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, messages, saving, setLocale } = useI18n();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={messages.topbar.selectLanguage}
          title={messages.topbar.selectLanguage}
          className={cn(
            "bg-surface text-muted-foreground hover:text-foreground border-line relative grid size-10 place-items-center rounded-full border transition-colors",
            saving && "opacity-70",
            className,
          )}
        >
          <Globe className="size-4" aria-hidden="true" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <div className="px-3 py-1.5 text-[11px] font-medium text-muted-foreground">
          {messages.topbar.languageLabel}
        </div>
        {LOCALE_OPTIONS.map((option) => {
          const active = option.code === locale;
          return (
            <DropdownMenuItem
              key={option.code}
              onSelect={() => void setLocale(option.code)}
              className="flex items-center justify-between gap-3"
            >
              <span className="flex items-center gap-2">
                <span className="bg-surface-subtle border-line text-foreground/80 rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold">
                  {option.short}
                </span>
                <span>{option.label}</span>
              </span>
              {active ? <Check className="text-accent size-3.5" /> : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
