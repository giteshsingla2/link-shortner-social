import type { Breakdown } from "@/lib/stats";
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
