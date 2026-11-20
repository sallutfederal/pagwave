"use client";

import { useId } from "react";

import { cn } from "@/lib/utils";

type KpiTone = "in" | "out" | "net" | "neutral";

/**
 * Modern monochrome (black & white / platinum) layered SVG icons for
 * transaction KPI summary cards. Uses currentColor opacity layers so they
 * stay razor-sharp in both dark obsidian and light surfaces.
 */
export function TransactionKpiIcon({
  kind,
  className,
}: {
  kind: KpiTone;
  className?: string;
}) {
  const uid = useId().replace(/:/g, "");
  const gradMain = `${uid}-mono-main`;
  const gradSoft = `${uid}-mono-soft`;

  if (kind === "in") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="5" y1="4" x2="23" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="1" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.62" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="14" y1="13" x2="14" y2="24" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.18" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
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
        <path
          d="M8.5 7.2A7.5 7.5 0 0 1 19.5 7.2"
          stroke="currentColor"
          strokeOpacity="0.32"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeDasharray="2 2.5"
        />
        <path
          d="M14 5.2v11.3m0 0-3.8-3.8m3.8 3.8 3.8-3.8"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="14" cy="19.6" r="1.3" fill="currentColor" />
      </svg>
    );
  }

  if (kind === "out") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="4" y1="24" x2="24" y2="4" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.68" />
            <stop offset="1" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="4" y1="9" x2="20" y2="23" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <rect
          x="4.75"
          y="8.75"
          width="14.5"
          height="14.5"
          rx="3.5"
          fill={`url(#${gradSoft})`}
          stroke="currentColor"
          strokeOpacity="0.38"
          strokeWidth="1.45"
        />
        <circle cx="21" cy="7" r="3.2" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.2" />
        <path
          d="M11 17 21.2 6.8m0 0h-5.4m5.4 0v5.4"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="17" r="1.4" fill="currentColor" fillOpacity="0.9" />
      </svg>
    );
  }

  if (kind === "net") {
    return (
      <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
        <defs>
          <linearGradient id={gradMain} x1="4" y1="18" x2="24" y2="7" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.65" />
            <stop offset="1" stopColor="currentColor" stopOpacity="1" />
          </linearGradient>
          <linearGradient id={gradSoft} x1="14" y1="8" x2="14" y2="22" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M4.5 21.5h19"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeDasharray="2 2.5"
        />
        <path
          d="M5 17.8 C 8.4 10.6, 12.1 11.2, 14.4 15.8 C 16.8 20.4, 20.1 18.6, 22.8 9.2 L 22.8 21.5 L 5 21.5 Z"
          fill={`url(#${gradSoft})`}
        />
        <path
          d="M5 17.8 C 8.4 10.6, 12.1 11.2, 14.4 15.8 C 16.8 20.4, 20.1 18.6, 22.8 9.2"
          stroke={`url(#${gradMain})`}
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <circle cx="22.8" cy="9.2" r="2.1" fill="currentColor" />
        <circle cx="22.8" cy="9.2" r="4" stroke="currentColor" strokeOpacity="0.28" strokeWidth="1.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 28 28" fill="none" aria-hidden="true" className={cn("size-6", className)}>
      <defs>
        <linearGradient id={gradMain} x1="5" y1="4" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.98" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.62" />
        </linearGradient>
        <linearGradient id={gradSoft} x1="6" y1="6" x2="21" y2="23" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      <path
        d="M9.5 6.2V5.5A2.25 2.25 0 0 1 11.75 3.25h8A2.25 2.25 0 0 1 22 5.5v12.25a2.25 2.25 0 0 1-2.25 2.25H19"
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
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
      <path
        d="M9 12h6.5M9 15.5h6.5M9 19h4"
        stroke="currentColor"
        strokeOpacity="0.72"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="15.8" cy="19" r="1.25" fill="currentColor" />
    </svg>
  );
}
