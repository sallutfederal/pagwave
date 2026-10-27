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
 * pagwave mark — a dark fintech tile.
 *
 * Layers: near-black navy gradient, a glassy top-left sheen, a hairline accent
 * border that fades towards the bottom-right, and the `N` monogram drawn as
 * vector rectangles (no font dependency) so it stays crisp from a 16px favicon
 * up to a 512px app icon.
 *
 * Every colour comes from a CSS variable, so a light-surface variant is one
 * class away: `style={{ "--logo-from": "#fff" }}`.
 */
export function LogoMark({ size = 32, className, radius = 25 }: LogoMarkProps) {
  // Gradient ids must be unique per instance: the sidebar, nav and footer can
  // render several marks on the same page.
  const uid = useId();
  const bg = `${uid}-bg`;
  const edge = `${uid}-edge`;
  const mark = `${uid}-n`;
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
          <stop offset="0" stopColor="var(--logo-from, #16213a)" />
          <stop offset="1" stopColor="var(--logo-to, #05080f)" />
        </linearGradient>

        <linearGradient id={edge} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--logo-edge, #4c8dff)" stopOpacity="0.55" />
          <stop offset="0.55" stopColor="var(--logo-edge, #4c8dff)" stopOpacity="0.08" />
          <stop offset="1" stopColor="var(--logo-edge, #4c8dff)" stopOpacity="0" />
        </linearGradient>

        <linearGradient id={mark} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--logo-n-from, #ffffff)" />
          <stop offset="1" stopColor="var(--logo-n-to, #9cc0ff)" />
        </linearGradient>

        <linearGradient id={sheen} x1="0" y1="0" x2="0.55" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.12" />
          <stop offset="0.5" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* tile */}
      <rect width="64" height="64" rx={r} fill={`url(#${bg})`} />
      <rect x="1" y="1" width="62" height="62" rx={r - 1} fill={`url(#${sheen})`} />
      <rect
        x="1"
        y="1"
        width="62"
        height="62"
        rx={r - 1}
        fill="none"
        stroke={`url(#${edge})`}
        strokeWidth="2"
      />

      {/* N monogram */}
      <g fill={`url(#${mark})`}>
        <rect x="16" y="15" width="9" height="34" rx="2.5" />
        <rect x="39" y="15" width="9" height="34" rx="2.5" />
        <rect x="27" y="8" width="10" height="48" rx="2.5" transform="rotate(-19 32 32)" />
      </g>
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