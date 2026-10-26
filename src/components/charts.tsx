import type { Breakdown } from "@/lib/stats";
import { formatNumber } from "@/lib/format";

/**
 * Grid for a row of StatCards: two columns on phones (an odd last tile spans
 * both), three on tablets, one even row on wide screens.
 */
export const STAT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 lg:auto-cols-fr lg:grid-flow-col lg:grid-cols-none [&>:last-child:nth-child(odd)]:col-span-2 sm:[&>:last-child:nth-child(odd)]:col-span-1";

/** A macOS-widget style tile: tinted icon, small label, big number. */
export function StatCard({
  label,
  value,
  hint,
  icon,
  tint = "orange",
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  tint?: Tint;
}) {
  return (
    <div className="card flex min-w-0 flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        {icon && <TintTile tint={tint}>{icon}</TintTile>}
        <p className="truncate text-[13px] font-medium text-muted">{label}</p>
      </div>
      <div className="min-w-0">
        <p className="truncate font-display text-[28px] leading-none font-semibold tracking-tight tabular-nums">{value}</p>
        {hint && <p className="mt-1.5 truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

/** A small rounded tile holding an icon, tinted like a macOS app glyph. */
export function TintTile({ tint, size = 28, children }: { tint: Tint; size?: number; children: React.ReactNode }) {
  return (
    <span
      className="grid shrink-0 place-items-center text-white"
      style={{ ...TINTS[tint], width: size, height: size, borderRadius: size * 0.32, boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}
    >
      {children}
    </span>
  );
}

export type Tint = keyof typeof TINTS;

const TINTS = {
  orange: { background: "linear-gradient(160deg, #ffb340, #f0562b)" },
  gold: { background: "linear-gradient(160deg, #ffd65a, #f2a516)" },
  rose: { background: "linear-gradient(160deg, #ff8fa3, #e64a6e)" },
  blue: { background: "linear-gradient(160deg, #6ab0ff, #2f6fe0)" },
  green: { background: "linear-gradient(160deg, #5fdc8c, #1f9d55)" },
  purple: { background: "linear-gradient(160deg, #c39bff, #7b4fe0)" },
} satisfies Record<string, React.CSSProperties>;

/** Ranked list: label on the left, count and share on the right, a soft bar behind. */
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
      <div className="mb-2.5 flex items-baseline justify-between px-1">
        <h3 className="text-[13px] font-semibold">{title}</h3>
        {total > 0 && <span className="eyebrow">Clicks</span>}
      </div>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted">No clicks yet</p>
      ) : (
        <ul className="space-y-1">
          {data.map((d) => (
            <li key={d.label} className="relative flex items-center justify-between gap-3 overflow-hidden rounded-[10px] px-2.5 py-[7px] text-sm">
              <span
                className="absolute inset-y-0 left-0 rounded-[10px]"
                style={{ width: `${(d.count / max) * 100}%`, background: "linear-gradient(90deg, var(--accent-soft), color-mix(in srgb, var(--accent-2) 14%, transparent))" }}
                aria-hidden
              />
              <span className="relative truncate">{formatLabel(d.label)}</span>
              <span className="relative shrink-0 tabular-nums text-muted">
                <span className="font-semibold text-ink">{formatNumber(d.count)}</span>
                <span className="ml-2 inline-block w-9 text-right text-xs">{Math.round((d.count / total) * 100)}%</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
