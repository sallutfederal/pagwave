import { useId } from "react";

import { cn } from "@/lib/utils";

type LogoMarkProps = {
  /** Rendered width/height in pixels. The mark keeps its aspect ratio. */
  size?: number;
  className?: string;
  /** Rounded-corner radius as a percentage of the size. */
  radius?: number;
};

/**
 * pagwave mark — Obsidian & Champagne Gold liquid payment wave.
 *
 * Layers: deep obsidian gradient tile, subtle glass sheen, hairline rim,
 * twin harmonic payment waves flowing upward with a settlement pulse node.
 * Respects `--logo-from`, `--logo-to`, `--logo-edge`, `--logo-n-from`,
 * `--logo-n-to` and `--logo-accent` CSS custom properties for light/dark surfaces.
 */
export function LogoMark({ size = 32, className, radius = 25 }: LogoMarkProps) {
  const uid = useId();
  const bg = `${uid}-bg`;
  const edge = `${uid}-edge`;
  const waveGrad = `${uid}-wave`;
  const accentGrad = `${uid}-accent`;
  const sheen = `${uid}-sheen`;
  const r = (radius / 100) * 64;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="pagwave"
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={bg} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--logo-from, #16181f)" />
          <stop offset="1" stopColor="var(--logo-to, #07080b)" />
        </linearGradient>

        <linearGradient id={edge} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--logo-edge, #e2be72)" stopOpacity="0.62" />
          <stop offset="0.55" stopColor="var(--logo-edge, #e2be72)" stopOpacity="0.16" />
          <stop offset="1" stopColor="var(--logo-edge, #e2be72)" stopOpacity="0.04" />
        </linearGradient>

        <linearGradient id={waveGrad} x1="0.1" y1="0.2" x2="0.9" y2="0.8">
          <stop offset="0" stopColor="var(--logo-n-from, #ffffff)" />
          <stop offset="0.6" stopColor="var(--logo-n-to, #f3e3bd)" />
          <stop offset="1" stopColor="var(--logo-accent, #d4ae5f)" />
        </linearGradient>

        <linearGradient id={accentGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f5dfa8" />
          <stop offset="1" stopColor="#c79a43" />
        </linearGradient>

        <linearGradient id={sheen} x1="0" y1="0" x2="0.6" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tile */}
      <rect width="64" height="64" rx={r} fill={`url(#${bg})`} />
      <rect x="1" y="1" width="62" height="62" rx={Math.max(r - 1, 2)} fill={`url(#${sheen})`} />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx={Math.max(r - 1, 2)}
        fill="none"
        stroke={`url(#${edge})`}
        strokeWidth="1.75"
      />

      {/* Harmonic secondary flow */}
      <path
        d="M 14 44 C 21 34, 27.5 34.5, 33.5 41.5 C 39.5 48.5, 45.5 46.5, 51 36"
        fill="none"
        stroke={`url(#${waveGrad})`}
        strokeOpacity="0.38"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Primary liquid wave */}
      <path
        d="M 12 36.5 C 18.5 18, 27 18.5, 32.5 31.5 C 38 44.5, 45.5 42.5, 51 23"
        fill="none"
        stroke={`url(#${waveGrad})`}
        strokeWidth="5.4"
        strokeLinecap="round"
      />

      {/* Settlement node pulse */}
      <circle cx="51" cy="23" r="3.6" fill={`url(#${accentGrad})`} />
    </svg>
  );
}

type LogoLockupProps = {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
  showWordmark?: boolean;
};

/** Mark + wordmark, for headers and documents. */
export function LogoLockup({
  size = 32,
  className,
  wordmarkClassName,
  showWordmark = true,
}: LogoLockupProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showWordmark ? (
        <span className={cn("text-[15px] font-semibold tracking-tight", wordmarkClassName)}>
          pagwave
        </span>
      ) : null}
    </span>
  );
}
