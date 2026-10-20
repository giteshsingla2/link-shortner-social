import Link from "next/link";
import { RANGES, type RangeDays } from "@/lib/stats";

export function RangeTabs({ basePath, current }: { basePath: string; current: RangeDays }) {
  return (
    <nav className="inline-flex rounded-lg border border-line bg-surface p-0.5 text-sm" aria-label="Date range">
      {RANGES.map((r) => (
        <Link
          key={r}
          href={`${basePath}?range=${r}`}
          scroll={false}
          aria-current={r === current ? "page" : undefined}
          className={`rounded-md px-3 py-1.5 font-medium transition ${
            r === current ? "bg-accent text-accent-ink" : "text-muted hover:text-ink"
          }`}
        >
          {r} days
        </Link>
      ))}
    </nav>
  );
}
