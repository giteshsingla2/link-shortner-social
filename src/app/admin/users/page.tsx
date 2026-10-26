import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchBox, Segmented } from "@/components/admin/controls";
import { UsersTable } from "@/components/admin/tables";
import { Toolbar } from "@/components/toolbar";
import { getUsersWithStats, type UserSort } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { formatNumber } from "@/lib/format";
import { getViewerZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Users · Admin · Shortly" };

const SORTS: { value: UserSort; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "clicks", label: "All-time" },
  { value: "links", label: "Links" },
  { value: "newest", label: "Newest" },
];

function one(v: string | string[] | undefined) {
  return (Array.isArray(v) ? v[0] : v)?.trim() || undefined;
}

export default function AdminUsersPage({ searchParams }: PageProps<"/admin/users">) {
  return (
    <>
      <Toolbar title="Users" subtitle="Everyone with an account" />
      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Users searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Users({ searchParams }: { searchParams: PageProps<"/admin/users">["searchParams"] }) {
  await requireAdmin();
  const params = await searchParams;
  const q = one(params.q);
  const sort = SORTS.find((s) => s.value === one(params.sort))?.value ?? "today";
  const rows = await getUsersWithStats({ zone: await getViewerZone(), q, sort });

  const href = (s: UserSort) => `/admin/users?${new URLSearchParams({ sort: s, ...(q ? { q } : {}) })}`;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchBox action="/admin/users" q={q} placeholder="Search name or email" keep={{ sort }} />
        <Segmented items={SORTS.map((s) => ({ href: href(s.value), label: s.label, active: s.value === sort }))} />
      </div>
      <p className="px-1 text-[13px] text-muted">
        {q ? `${formatNumber(rows.length)} matching “${q}”` : `${formatNumber(rows.length)} users`} · sorted by{" "}
        {SORTS.find((s) => s.value === sort)!.label.toLowerCase()}
      </p>
      <UsersTable rows={rows} empty={q ? "No users match that search." : "No users yet."} />
    </>
  );
}
