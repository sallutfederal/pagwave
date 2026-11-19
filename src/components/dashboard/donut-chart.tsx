import { formatCurrency } from "@/lib/format";
import type { Statistic } from "@/lib/schemas";

const SIZE = 208;
const STROKE = 22;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Degrees removed from each arc so the ring keeps the reference spacing. */
const GAP = 12;

const SEGMENT_COLORS: Record<string, string> = {
  bills: "var(--color-chart-bills)",
  money: "var(--color-chart-money)",
};

type Arc = { id: string; length: number; offset: number };

/** Turns segment degrees into SVG dash lengths/offsets, one after the other. */
function buildArcs(segments: Statistic["segments"]): Arc[] {
  let cursor = 0;

  return segments.map((segment) => {
    const sweep = Math.max(segment.degrees - GAP, 0);
    const arc: Arc = {
      id: segment.id,
      length: (sweep / 360) * CIRCUMFERENCE,
      offset: -(cursor / 360) * CIRCUMFERENCE,
    };

    cursor += segment.degrees;

    return arc;
  });
}

type DonutChartProps = Pick<Statistic, "segments" | "total" | "label" | "currency">;

export function DonutChart({ segments, total, label, currency }: DonutChartProps) {
  const arcs = buildArcs(segments);

  return (
    <div className="relative mx-auto shrink-0" style={{ width: SIZE, height: SIZE }}>
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        role="img"
        aria-label={`${label}: ${formatCurrency({ amount: total, currency, fractionDigits: 2 }, { symbolSpacing: false })}`}
        className="-rotate-90"
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          stroke="var(--color-line)"
          strokeOpacity={0.35}
        />
        {arcs
          .filter((arc) => arc.length > 0)
          .map((arc, index) => (
            <circle
              key={arc.id}
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              strokeWidth={STROKE}
              strokeLinecap="round"
              stroke={SEGMENT_COLORS[arc.id] ?? "var(--color-accent)"}
              strokeDasharray={`${arc.length} ${CIRCUMFERENCE - arc.length}`}
              strokeDashoffset={arc.offset}
              style={{
                transition: "stroke-dasharray 500ms ease, stroke-dashoffset 500ms ease",
                transitionDelay: `${index * 60}ms`,
              }}
            />
          ))}
      </svg>

      <div className="absolute inset-0 grid place-items-center">
        <span className="text-foreground text-[19px] font-semibold tabular-nums">
          {formatCurrency({ amount: total, currency, fractionDigits: 2 }, { symbolSpacing: false })}
        </span>
      </div>

      <span className="bg-surface border-line text-foreground absolute top-1/2 right-0.5 -translate-y-1/2 rounded-full border px-2.5 py-1 text-[10px] font-medium shadow-sm backdrop-blur-md">
        {label}
      </span>
    </div>
  );
}

export function ChartLegend({ segments }: { segments: Statistic["segments"] }) {
  return (
    <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
      {segments.map((segment) => (
        <li key={segment.id} className="text-muted-foreground flex items-center gap-2 text-[11px]">
          <span
            aria-hidden
            className="size-2.5 rounded-[3px]"
            style={{ backgroundColor: SEGMENT_COLORS[segment.id] ?? "var(--color-accent)" }}
          />
          {segment.label}
        </li>
      ))}
    </ul>
  );
}