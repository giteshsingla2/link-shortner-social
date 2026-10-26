import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBox, Segmented } from "@/components/admin/controls";
import { ClicksTable } from "@/components/admin/tables";
import { Toolbar } from "@/components/toolbar";
import { getRecentClicks, type ClickDay } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getViewerZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Clicks · Admin · Shortly" };

const LIMIT = 200;
const DAYS: { value: ClickDay; label: string }[] = [
  { value: "all", label: "All" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
];

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

export default function AdminClicksPage({ searchParams }: PageProps<"/admin/clicks">) {
  return (
    <>
      <Toolbar title="Clicks" subtitle="The latest clicks on every link, newest first" />
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Clicks searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Clicks({ searchParams }: { searchParams: PageProps<"/admin/clicks">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q);
  const day = DAYS.find((d) => d.value === one(params.day))?.value ?? "all";
  const zone = await getViewerZone();
  const rows = await getRecentClicks({ zone, q, day, limit: LIMIT });

  const href = (d: ClickDay) => `/admin/clicks?${new URLSearchParams({ day: d, ...(q ? { q } : {}) })}`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox action="/admin/clicks" q={q} placeholder="Search link ending, title or owner" keep={{ day }} />
        <Segmented items={DAYS.map((d) => ({ href: href(d.value), label: d.label, active: d.value === day }))} />
      </div>
      <p className="px-1 text-[13px] text-muted">
        {rows.length === LIMIT ? `Latest ${LIMIT} clicks` : `${formatNumber(rows.length)} ${rows.length === 1 ? "click" : "clicks"}`}
        {day !== "all" && ` ${day}`}
        {q && ` matching “${q}”`} · times in {zone.name === "UTC" ? "UTC" : zone.name.replace(/_/g, " ")}
      </p>
      <ClicksTable rows={rows} timeZone={zone.name} empty="No clicks match." />
    </>
  );
}
