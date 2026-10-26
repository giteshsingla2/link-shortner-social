import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBox, Segmented } from "@/components/admin/controls";
import { LinksTable } from "@/components/admin/tables";
import { Toolbar } from "@/components/toolbar";
import { getLinksWithStats, type LinkSort } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getViewerZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Links · Admin · Shortly" };

const SORTS: { value: LinkSort; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "clicks", label: "All-time" },
];

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

export default function AdminLinksPage({ searchParams }: PageProps<"/admin/links">) {
  return (
    <>
      <Toolbar title="Links" subtitle="Every link from every user" />
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Links searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Links({ searchParams }: { searchParams: PageProps<"/admin/links">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q);
  const sort = SORTS.find((s) => s.value === one(params.sort))?.value ?? "newest";
  const rows = await getLinksWithStats({ zone: await getViewerZone(), q, sort });

  const href = (s: LinkSort) => `/admin/links?${new URLSearchParams({ sort: s, ...(q ? { q } : {}) })}`;
  const back = `/admin/links?${new URLSearchParams({ sort, ...(q ? { q } : {}) })}`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox action="/admin/links" q={q} placeholder="Search ending, URL, title or owner" keep={{ sort }} />
        <Segmented items={SORTS.map((s) => ({ href: href(s.value), label: s.label, active: s.value === sort }))} />
      </div>
      <p className="px-1 text-[13px] text-muted">
        {q ? `${formatNumber(rows.length)} matching “${q}”` : `Latest ${formatNumber(rows.length)} links`}
        {rows.length === 500 && " (showing the first 500, search to narrow down)"}
      </p>
      <LinksTable rows={rows} back={back} empty={q ? "No links match that search." : "No links yet."} />
    </>
  );
}
