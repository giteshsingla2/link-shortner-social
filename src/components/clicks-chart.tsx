"use client";

import { useState } from "react";
import type { ChartPoint } from "@/lib/stats";
import { formatNumber } from "@/lib/format";

const compact = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });

/** Smallest 1, 2 or 5 x 10^n that is at least `n`, so the scale shows round numbers. */
function niceStep(n: number) {
  const pow = 10 ** Math.floor(Math.log10(Math.max(1, n)));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= n)!;
}

/**
 * Clicks per day (or per hour, for today) as bars. Built from plain elements
 * rather than a stretched SVG so the numbers stay crisp at any width.
 * Counts sit on top of the bars when there's room (always for a week, and on
 * wider screens for today and 30 days). Hover or tap a bar for its exact count.
 */
export function ClicksChart({ data, unit }: { data: ChartPoint[]; unit: "day" | "hour" }) {
  const [active, setActive] = useState<number | null>(null);

  const peak = Math.max(0, ...data.map((d) => d.count));
  const step = niceStep(Math.ceil(peak / 2));
  const top = step * 2;
  const labels = data.length <= 7 ? "block" : data.length <= 31 ? "hidden sm:block" : null;
  // About 4 labels on any range: first, last and two in between.
  const axisIdx = [...new Set([0, Math.round((data.length - 1) / 3), Math.round(((data.length - 1) * 2) / 3), data.length - 1])];

  const shown = active === null ? null : data[active];
  const pct = (count: number) => (count / top) * 100;

  return (
    <section className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold">Clicks per {unit}</h3>
        <span className="text-xs text-muted">Peak {formatNumber(peak)}/{unit}</span>
      </div>

      {/* Top margin leaves room for the count above the tallest bar. */}
      <div className="mt-5 flex gap-2">
        {/* Scale: 0, the middle line and the top line. */}
        <div className="relative h-36 w-7 shrink-0 text-right text-[11px] leading-none text-muted tabular-nums sm:h-48" aria-hidden>
          {[top, step, 0].map((v, i) => (
            <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - v / top) * 100}%` }}>
              {compact.format(v)}
            </span>
          ))}
        </div>

        <div className="relative h-36 min-w-0 flex-1 sm:h-48" onMouseLeave={() => setActive(null)}>
          {[0, 50, 100].map((y) => (
            <div key={y} className="absolute inset-x-0 border-t border-line" style={{ top: `${y}%` }} aria-hidden />
          ))}

          <div className="absolute inset-0 flex" role="list" aria-label={`Clicks per ${unit}`}>
            {data.map((d, i) => {
              const h = pct(d.count);
              const isActive = active === i;
              return (
                <div
                  key={d.key}
                  role="listitem"
                  aria-label={`${d.label}: ${formatNumber(d.count)} clicks, ${formatNumber(d.visitors)} visitors`}
                  className="relative h-full flex-1 cursor-default"
                  onMouseEnter={() => setActive(i)}
                  onClick={() => setActive(isActive ? null : i)}
                >
                  {isActive && <div className="absolute inset-0 rounded-sm bg-accent-soft/60" aria-hidden />}
                  <div
                    className={`absolute bottom-0 left-[15%] right-[15%] rounded-t-sm bg-accent transition-opacity ${
                      active !== null && !isActive ? "opacity-50" : ""
                    }`}
                    style={{ height: d.count ? `max(${h}%, 3px)` : 0 }}
                    aria-hidden
                  />
                  {labels && d.count > 0 && (
                    <span
                      className={`${labels} pointer-events-none absolute inset-x-0 text-center text-[11px] font-medium leading-none text-ink tabular-nums`}
                      style={{ bottom: `calc(${h}% + 4px)` }}
                      aria-hidden
                    >
                      {compact.format(d.count)}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {shown && active !== null && (
            <div
              className={`pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-line bg-surface px-2.5 py-1.5 text-xs shadow-lg ${
                active < data.length / 6 ? "" : active > (data.length * 5) / 6 ? "-translate-x-full" : "-translate-x-1/2"
              }`}
              style={{
                left: `${((active + (active < data.length / 6 ? 0 : active > (data.length * 5) / 6 ? 1 : 0.5)) / data.length) * 100}%`,
                bottom: `calc(${Math.min(pct(shown.count), 100)}% + ${labels ? 22 : 8}px)`,
              }}
            >
              <span className="text-muted">{shown.label}</span>
              <span className="ml-2 font-semibold tabular-nums">
                {formatNumber(shown.count)} {shown.count === 1 ? "click" : "clicks"}
              </span>
              <span className="ml-1.5 text-muted tabular-nums">
                · {formatNumber(shown.visitors)} {shown.visitors === 1 ? "visitor" : "visitors"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Each label sits under the middle of its bar; the outermost ones hug the edges. */}
      <div className="relative ml-9 mt-2 h-4 text-xs text-muted tabular-nums">
        {axisIdx.map((i) => {
          const center = ((i + 0.5) / data.length) * 100;
          const shift = center < 6 ? "" : center > 94 ? "-translate-x-full" : "-translate-x-1/2";
          const left = center < 6 ? 0 : center > 94 ? 100 : center;
          return (
            <span key={i} className={`absolute whitespace-nowrap ${shift}`} style={{ left: `${left}%` }}>
              {data[i].label}
            </span>
          );
        })}
      </div>
    </section>
  );
}
