import Link from "next/link";

/**
 * A plain GET search form, so results are shareable URLs and it works without
 * JavaScript. `keep` carries other query values (sort, day) through a search.
 */
export function SearchBox({
  action,
  q,
  placeholder,
  keep = {},
}: {
  action: string;
  q?: string;
  placeholder: string;
  keep?: Record<string, string | undefined>;
}) {
  return (
    <form action={action} className="flex w-full gap-2 sm:max-w-md" role="search">
      {Object.entries(keep).map(([name, value]) => value && <input key={name} type="hidden" name={name} value={value} />)}
      <input name="q" defaultValue={q} className="input py-2" placeholder={placeholder} aria-label={placeholder} />
      <button type="submit" className="btn-ghost shrink-0">
        Search
      </button>
      {q && (
        <Link href={action} className="btn-ghost shrink-0">
          Clear
        </Link>
      )}
    </form>
  );
}

/** A macOS segmented control made of links (sort order, day filter). */
export function Segmented({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <nav
      className="inline-flex max-w-full overflow-x-auto rounded-full border border-line p-[3px] text-[13px]"
      style={{ background: "var(--field)", boxShadow: "inset 0 1px 2px rgba(0,0,0,.06)" }}
    >
      {items.map((i) => (
        <Link
          key={i.href}
          href={i.href}
          scroll={false}
          aria-current={i.active ? "page" : undefined}
          className={`rounded-full px-3 py-1 font-medium whitespace-nowrap transition ${i.active ? "text-ink" : "text-muted hover:text-ink"}`}
          style={i.active ? { background: "var(--surface)", boxShadow: "0 1px 3px rgba(0,0,0,.12), inset 0 1px 0 var(--glass-shine)" } : undefined}
        >
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

const BADGE = {
  red: "bg-danger/12 text-danger",
  orange: "bg-accent-soft text-link",
  green: "bg-good/15 text-good",
  gray: "bg-hover text-muted",
};

export function Badge({ tone, children }: { tone: keyof typeof BADGE; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${BADGE[tone]}`}>{children}</span>;
}

/** Today's count with the change from yesterday next to it. */
export function TodayVsYesterday({ today, yesterday, change }: { today: number; yesterday: number; change: string }) {
  const up = change.startsWith("+") || change === "New";
  const down = change.startsWith("−");
  return (
    <span className="tabular-nums">
      <span className="font-semibold">{today.toLocaleString("en")}</span>
      {change && <span className={`ml-1.5 text-[11px] font-semibold ${up ? "text-good" : down ? "text-danger" : "text-muted"}`}>{change}</span>}
      <span className="sr-only"> today, {yesterday} yesterday</span>
    </span>
  );
}
