"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type KpiTone = "in" | "out" | "net" | "neutral";

/**
 * Custom layered fintech SVG icons for the transaction KPI summary cards,
 * crafted to match Pagwave's metallic tile & duotone hairline aesthetic.
 */
export function TransactionKpiIcon({
  kind,
  className,
}: {
  kind: KpiTone;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradMain = `${uid}-main`;
  const gradSoft = `${uid}-soft`;

  if (kind === "in") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#6ee7b7" />
            <stop offset="1" stopColor="#10b981" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="14" y1="12" x2="14" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#34d399" stopOpacity="0.28" />
            <stop offset="1" stopColor="#10b981" stopOpacity="0.04" />
          </linearGradient>
        </defs>
        {/* Liquidity vault basin */}
        <path
          d="M5 16.5v3.25A3.25 3.25 0 0 0 8.25 23h11.5A3.25 3.25 0 0 0 23 19.75V16.5"
          fill={`url(#${gradSoft})`}
        />
        <path
          d="M5 16.5v3.25A3.25 3.25 0 0 0 8.25 23h11.5A3.25 3.25 0 0 0 23 19.75V16.5"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.65"
          strokeLinecap="round"
        />
        {/* Precision orbital arc */}
        <path
          d="M8.5 7.2A7.5 7.5 0 0 1 19.5 7.2"
          stroke="#6ee7b7"
          strokeOpacity="0.35"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="2 2.5"
        />
        {/* Incoming settlement shaft & head */}
        <path
          d="M14 5.2v11.3m0 0-3.8-3.8m3.8 3.8 3.8-3.8"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="19.6" r="1.3" fill="#6ee7b7" />
      </svg>
    );
  }

  if (kind === "out") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="4" y1="24" x2="24" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fda4af" />
            <stop offset="1" stopColor="#f43f5e" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="4" y1="10" x2="20" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#fb7185" stopOpacity="0.22" />
            <stop offset="1" stopColor="#f43f5e" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {/* Origin frame */}
        <rect
          x="4.75"
          y="8.75"
          width="14.5"
          height="14.5"
          rx="3.5"
          fill={`url(#${gradSoft})`}
          stroke="#fb7185"
          strokeOpacity="0.45"
          strokeWidth="1.45"
        />
        {/* Target halo */}
        <circle cx="21" cy="7" r="3.2" stroke="#fda4af" strokeOpacity="0.32" strokeWidth="1.2" />
        {/* Outbound diagonal vector */}
        <path
          d="M11 17 21.2 6.8m0 0h-5.4m5.4 0v5.4"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="17" r="1.4" fill="#fda4af" />
      </svg>
    );
  }

  if (kind === "net") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="4" y1="18" x2="24" y2="7" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#ffffff" />
            <stop offset="0.55" stopColor="#f3e3bd" />
            <stop offset="1" stopColor="#d4ae5f" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="14" y1="8" x2="14" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#e2be72" stopOpacity="0.34" />
            <stop offset="1" stopColor="#e2be72" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Subtle equilibrium baseline */}
        <path
          d="M4.5 21.5h19"
          stroke="currentColor"
          strokeOpacity="0.22"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="2 2.5"
        />
        {/* Area fill under liquid wave */}
        <path
          d="M5 17.8 C 8.4 10.6, 12.1 11.2, 14.4 15.8 C 16.8 20.4, 20.1 18.6, 22.8 9.2 L 22.8 21.5 L 5 21.5 Z"
          fill={`url(#${gradSoft})`}
        />
        {/* Harmonic wave echoing Pagwave brand */}
        <path
          d="M5 17.8 C 8.4 10.6, 12.1 11.2, 14.4 15.8 C 16.8 20.4, 20.1 18.6, 22.8 9.2"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        {/* Crest accent node */}
        <circle cx="22.8" cy="9.2" r="2.1" fill="#e2be72" />
        <circle cx="22.8" cy="9.2" r="4" stroke="#f5dfa8" strokeOpacity="0.28" strokeWidth="1.1" />
      </svg>
    );
  }

  // neutral: Multi-layer verified ledger stack
  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
      <defs>
        <linearGradient id={gradMain} x1="5" y1="4" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.58" />
        </linearGradient>
        <linearGradient id={gradSoft} x1="6" y1="6" x2="21" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {/* Back stacked sheet */}
      <path
        d="M9.5 6.2V5.5A2.25 2.25 0 0 1 11.75 3.25h8A2.25 2.25 0 0 1 22 5.5v12.25a2.25 2.25 0 0 1-2.25 2.25H19"
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      {/* Front glass sheet */}
      <rect
        x="5.5"
        y="6.75"
        width="13.5"
        height="17.5"
        rx="3"
        fill={`url(#${gradSoft})`}
        stroke={`url(#${gradMain})`}
        strokeWidth="1.6"
      />
      {/* Ledger entries */}
      <path
        d="M9 12h6.5M9 15.5h6.5M9 19h4"
        stroke="currentColor"
        strokeOpacity="0.72"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Live count indicator dot */}
      <circle cx="15.8" cy="19" r="1.25" fill="#e2be72" />
    </svg>
  );
}
