"use client";

import { ChevronDown, Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { CountryFlag, type FlagCode } from "@/components/landing/country-flag";
import { cn } from "@/lib/utils";

export interface AuthCountryOption {
  code: FlagCode;
  dial: string;
  name: string;
  placeholder: string;
}

export const AUTH_COUNTRIES: readonly AuthCountryOption[] = [
  { code: "BR", dial: "+55", name: "Brasil", placeholder: "11 91234 5678" },
  { code: "US", dial: "+1", name: "Estados Unidos", placeholder: "(555) 234-5678" },
  { code: "GB", dial: "+44", name: "Reino Unido", placeholder: "7700 900123" },
  { code: "MX", dial: "+52", name: "México", placeholder: "55 1234 5678" },
  { code: "PT", dial: "+351", name: "Portugal", placeholder: "912 345 678" },
  { code: "ES", dial: "+34", name: "Espanha", placeholder: "612 345 678" },
  { code: "DE", dial: "+49", name: "Alemanha", placeholder: "151 2345 6789" },
  { code: "FR", dial: "+33", name: "França", placeholder: "6 12 34 56 78" },
  { code: "IT", dial: "+39", name: "Itália", placeholder: "312 345 6789" },
  { code: "EU", dial: "+31", name: "União Europeia", placeholder: "6 1234 5678" },
  { code: "CA", dial: "+1", name: "Canadá", placeholder: "(416) 555-0142" },
  { code: "CH", dial: "+41", name: "Suíça", placeholder: "79 123 45 67" },
  { code: "AE", dial: "+971", name: "Emirados Árabes", placeholder: "50 123 4567" },
  { code: "SG", dial: "+65", name: "Singapura", placeholder: "8123 4567" },
  { code: "AU", dial: "+61", name: "Austrália", placeholder: "412 345 678" },
  { code: "JP", dial: "+81", name: "Japão", placeholder: "90 1234 5678" },
  { code: "KR", dial: "+82", name: "Coreia do Sul", placeholder: "10 1234 5678" },
  { code: "AR", dial: "+54", name: "Argentina", placeholder: "11 1234 5678" },
  { code: "CL", dial: "+56", name: "Chile", placeholder: "9 1234 5678" },
  { code: "CO", dial: "+57", name: "Colômbia", placeholder: "310 123 4567" },
  { code: "HK", dial: "+852", name: "Hong Kong", placeholder: "5123 4567" },
  { code: "IN", dial: "+91", name: "Índia", placeholder: "98765 43210" },
  { code: "CN", dial: "+86", name: "China", placeholder: "138 0013 8000" },
  { code: "NG", dial: "+234", name: "Nigéria", placeholder: "803 123 4567" },
];

interface AuthCountrySelectProps {
  value: FlagCode;
  onChange: (option: AuthCountryOption) => void;
  disabled?: boolean;
  searchPlaceholder: string;
}

/**
 * Frosted glass country & dial-code dropdown modeled after Limited's auth-page-dropdown.
 */
export function AuthCountrySelect({
  value,
  onChange,
  disabled,
  searchPlaceholder,
}: AuthCountrySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const selected = useMemo(
    () => AUTH_COUNTRIES.find((c) => c.code === value) ?? AUTH_COUNTRIES[0],
    [value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AUTH_COUNTRIES;
    return AUTH_COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.dial.includes(q) ||
        c.code.toLowerCase().includes(q),
    );
  }, [query]);

  useEffect(() => {
    if (!open) return;
    function onOutsideClick(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative z-40">
      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-10 w-[98px] items-center justify-between gap-1.5 rounded-lg border border-white/20 bg-white/[0.05] px-2.5 text-sm font-medium text-white backdrop-blur-md transition",
          "hover:border-white/35 hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-50",
          open && "border-white/45 bg-white/[0.1]",
        )}
      >
        <span className="flex items-center gap-1.5">
          <CountryFlag code={selected.code} className="h-[14px] w-[19px] rounded-[2px]" />
          <span className="text-[13px] tabular-nums">{selected.dial}</span>
        </span>
        <ChevronDown
          className={cn("size-3.5 text-white/60 transition-transform", open && "rotate-180")}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className="absolute top-full left-0 z-50 mt-2 w-68 overflow-hidden rounded-xl border border-white/12 bg-[#141414]/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="border-b border-white/10 p-2">
            <label className="relative block">
              <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-white/45" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                autoFocus
                className="h-8 w-full rounded-lg border border-white/15 bg-white/[0.05] pr-2.5 pl-8 text-xs text-white placeholder:text-white/40 outline-none focus:border-white/35"
              />
            </label>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.map((country) => {
              const active = country.code === selected.code;
              return (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    onChange(country);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center justify-between gap-2.5 px-3 py-2 text-left text-xs transition-colors",
                    active
                      ? "bg-[#e7d599]/15 text-[#e7d599]"
                      : "text-white/85 hover:bg-white/[0.08]",
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2.5">
                    <CountryFlag code={country.code} className="h-[14px] w-[19px] rounded-[2px]" />
                    <span className="truncate font-medium">{country.name}</span>
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-white/55">
                    {country.dial}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

