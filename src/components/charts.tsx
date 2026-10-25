import type { Breakdown, ChartPoint } from "@/lib/stats";
import { formatNumber } from "@/lib/format";

export function StatCard({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>}
    </div>
  );
}

/** Horizontal bars: label on the left, count and share on the right. */
export function BarList({
  title,
  data,
  formatLabel = (l) => l,
}: {
  title: string;
  data: Breakdown;
  formatLabel?: (label: string) => string;
}) {
  const total = data.reduce((s, d) => s + d.count, 0);
  const max = Math.max(1, ...data.map((d) => d.count));

  return (
    <section className="card p-4">
      <h3 className="mb-3 text-sm font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">No clicks yet</p>
      ) : (
        <ul className="space-y-1.5">
          {data.map((d) => (
            <li key={d.label} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-md px-2 py-1.5 text-sm">
              <span
                className="absolute inset-y-0 left-0 rounded-md bg-accent-soft"
                style={{ width: `${(d.count / max) * 100}%` }}
                aria-hidden
              />
              <span className="relative truncate">{formatLabel(d.label)}</span>
              <span className="relative shrink-0 tabular-nums text-muted">
                <span className="font-medium text-ink">{formatNumber(d.count)}</span>
                <span className="ml-2 inline-block w-10 text-right">{Math.round((d.count / total) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Clicks per day (or per hour, for today) as SVG bars. The SVG stretches to the
 * card's width, and the labels sit below it as normal text so they stay
 * readable on phones. Hover a bar to see the exact count.
 */
export function ClicksChart({ data, unit }: { data: ChartPoint[]; unit: "day" | "hour" }) {
  const title = `Clicks per ${unit}`;
  const peak = Math.max(0, ...data.map((d) => d.count));
  const max = Math.max(1, peak);
  const width = 1000;
  const height = 200;
  const slot = width / data.length;
  const barW = Math.max(2, slot * 0.7);
  // About 4 labels on any range: first, last and two in between.
  const labelIdx = [...new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1])];

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        <span className="text-xs text-muted">Peak {formatNumber(peak)}/{unit}</span>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-36 w-full sm:h-48"
        role="img"
        aria-label={title}
      >
        <line x1="0" x2={width} y1={height - 0.5} y2={height - 0.5} stroke="var(--line)" vectorEffect="non-scaling-stroke" />
        {data.map((d, i) => {
          const h = (d.count / max) * (height - 4);
          return (
            <g key={d.key}>
              <rect x={i * slot} y={0} width={slot} height={height} fill="transparent">
                <title>{`${d.label}: ${formatNumber(d.count)} clicks`}</title>
              </rect>
              <rect
                x={i * slot + (slot - barW) / 2}
                y={height - Math.max(h, d.count ? 3 : 0)}
                width={barW}
                height={Math.max(h, d.count ? 3 : 0)}
                fill="var(--accent)"
                pointerEvents="none"
              />
            </g>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between text-xs text-muted tabular-nums">
        {labelIdx.map((i) => (
          <span key={i}>{data[i].label}</span>
        ))}
      </div>
    </section>
  );
}
