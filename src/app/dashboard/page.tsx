import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CreateLinkForm } from "@/components/create-link-form";
import { BarList, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CopyButton } from "@/components/copy-button";
import { RangeTabs } from "@/components/range-tabs";
import { getCurrentUser } from "@/lib/auth";
import { getUserLinks, getUserOverview, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";
import { countryName, formatDate, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Dashboard · Shortly" };

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">Shorten a link</h1>
        <CreateLinkForm baseUrl={baseUrl} />
      </section>

      <Suspense fallback={<OverviewSkeleton />}>
        <Overview searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<div className="card h-64 animate-pulse" />}>
        <LinksTable />
      </Suspense>
    </div>
  );
}

async function Overview({ searchParams }: { searchParams: PageProps<"/dashboard">["searchParams"] }) {
  const user = await getCurrentUser();
  const range = parseRange((await searchParams).range);
  const o = await getUserOverview(user.id, range, await getViewerZone());
  const top = o.countries[0];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Overview</h2>
        <RangeTabs basePath="/dashboard" current={range} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr">
        <StatCard label="Total clicks" value={formatNumber(o.totalClicks)} hint="All time, all links" />
        <StatCard label="Clicks today" value={formatNumber(o.todayClicks)} hint="All links, since midnight" />
        {range !== 1 && <StatCard label={`Clicks, ${rangeLabel(range).toLowerCase()}`} value={formatNumber(o.rangeClicks)} />}
        <StatCard label="Links" value={formatNumber(o.totalLinks)} />
        <StatCard
          label="Top country"
          value={top ? countryName(top.label) : "None yet"}
          hint={top ? `${formatNumber(top.count)} clicks` : undefined}
        />
      </div>
      <ClicksChart data={o.series} unit={range === 1 ? "hour" : "day"} />
      <div className="grid gap-3 md:grid-cols-2">
        <BarList title="Top countries" data={o.countries} formatLabel={countryName} />
        <BarList title="Top platforms" data={o.platforms} />
      </div>
    </section>
  );
}

async function LinksTable() {
  const user = await getCurrentUser();
  const rows = await getUserLinks(user.id, await getViewerZone());

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold tracking-tight">Your links</h2>
      {rows.length === 0 ? (
        <div className="card p-8 text-center text-sm text-muted">
          No links yet. Paste one above and it will show up here.
        </div>
      ) : (
        <ul className="card divide-y divide-line">
          {rows.map((l) => {
            const short = shortUrl(l.slug);
            return (
              <li key={l.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1 space-y-0.5">
                  {l.title && <p className="truncate text-sm font-medium">{l.title}</p>}
                  <a href={short} target="_blank" rel="noreferrer" className="block truncate font-mono text-[15px] font-medium text-accent">
                    {prettyUrl(short)}
                  </a>
                  <p className="truncate text-sm text-muted" title={l.url}>
                    {prettyUrl(l.url)}
                  </p>
                  <p className="text-xs text-muted">Created {formatDate(l.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="mr-auto text-left sm:mr-2 sm:text-right">
                    <p className="text-lg font-semibold tabular-nums">{formatNumber(l.clickCount)}</p>
                    <p className="text-xs text-muted">
                      clicks · <span className={l.todayClicks ? "font-medium text-accent" : undefined}>{formatNumber(l.todayClicks)} today</span>
                    </p>
                  </div>
                  <CopyButton text={short} />
                  <Link href={`/dashboard/links/${l.id}`} className="btn-ghost">
                    Stats
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function OverviewSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-7 w-32 animate-pulse rounded bg-line/60" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
      <div className="card h-56 animate-pulse" />
    </div>
  );
}
