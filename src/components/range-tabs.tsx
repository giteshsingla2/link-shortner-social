import Link from "next/link";
import { RANGES, type RangeDays } from "@/lib/stats";

/** A macOS segmented control: the chosen segment is a raised white pill. */
export function RangeTabs({ basePath, current }: { basePath: string; current: RangeDays }) {
  return (
    <nav
      className="inline-flex rounded-full border border-line p-[3px] text-[13px]"
      style={{ background: "var(--field)", boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)" }}
      aria-label="Date range"
    >
      {RANGES.map((r) => {
        const active = r === current;
        return (
          <Link
            key={r}
            href={`${basePath}?range=${r}`}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1 font-medium whitespace-nowrap transition ${
              active ? "text-ink" : "text-muted hover:text-ink"
            }`}
            style={active ? { background: "var(--surface)", boxShadow: "0 1px 3px rgba(0,0,0,.12), inset 0 1px 0 var(--glass-shine)" } : undefined}
          >
            {r === 1 ? "Today" : `${r}D`}
          </Link>
        );
      })}
    </nav>
  );
}
