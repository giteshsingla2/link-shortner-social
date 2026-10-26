import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { CreateLinkForm } from "@/components/create-link-form";
import { BarList, STAT_GRID, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CopyButton } from "@/components/copy-button";
import { CalendarIcon, ChevronRightIcon, CursorIcon, GlobeIcon, LinkIcon, SunIcon } from "@/components/icons";
import { LinkAvatar } from "@/components/link-avatar";
import { RangeTabs } from "@/components/range-tabs";
import { Toolbar } from "@/components/toolbar";
import { getCurrentUser } from "@/lib/auth";
import { getUserLinks, getUserOverview, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";
import { countryLabel, countryName, formatDate, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Dashboard · Shortly" };

type SearchParams = PageProps<"/dashboard">["searchParams"];

function visitors(n: number) {
  return `${formatNumber(n)} unique ${n === 1 ? "visitor" : "visitors"}`;
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <>
      <Toolbar title="Overview" subtitle="Every link, every click">
        <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded-full bg-hover" />}>
          <Range searchParams={searchParams} />
        </Suspense>
      </Toolbar>

      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <section id="new" className="scroll-mt-24">
          <CreateLinkForm baseUrl={baseUrl} />
        </section>

        <Suspense fallback={<OverviewSkeleton />}>
          <Overview searchParams={searchParams} />
        </Suspense>

        <Suspense fallback={<div className="card h-64 animate-pulse" />}>
          <LinksList />
        </Suspense>
      </div>
    </>
  );
}

async function Range({ searchParams }: { searchParams: SearchParams }) {
  return <RangeTabs basePath="/dashboard" current={parseRange((await searchParams).range)} />;
}

async function Overview({ searchParams }: { searchParams: SearchParams }) {
  const user = await getCurrentUser();
  const range = parseRange((await searchParams).range);
  const o = await getUserOverview(user.id, range, await getViewerZone());
  const top = o.countries[0];

  return (
    <section className="space-y-4" aria-label="Overview">
      <div className={STAT_GRID}>
        <StatCard icon={<CursorIcon size={15} />} tint="orange" label="Total clicks" value={formatNumber(o.totalClicks)} hint="All time, all links" />
        <StatCard icon={<SunIcon size={15} />} tint="gold" label="Today" value={formatNumber(o.todayClicks)} hint={visitors(o.todayVisitors)} />
        {range !== 1 && (
          <StatCard icon={<CalendarIcon size={15} />} tint="rose" label={rangeLabel(range)} value={formatNumber(o.rangeClicks)} hint={visitors(o.rangeVisitors)} />
        )}
        <StatCard icon={<LinkIcon size={15} />} tint="blue" label="Links" value={formatNumber(o.totalLinks)} />
        <StatCard
          icon={<GlobeIcon size={15} />}
          tint="green"
          label="Top country"
          value={top ? countryName(top.label) : "None yet"}
          hint={top ? `${formatNumber(top.count)} clicks` : undefined}
        />
      </div>
      <ClicksChart data={o.series} unit={range === 1 ? "hour" : "day"} />
      <div className="grid gap-3 md:grid-cols-2">
        <BarList title="Top countries" data={o.countries} formatLabel={countryLabel} />
        <BarList title="Top platforms" data={o.platforms} />
      </div>
    </section>
  );
}

async function LinksList() {
  const user = await getCurrentUser();
  const rows = await getUserLinks(user.id, await getViewerZone());

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between px-1">
        <h2 className="font-display text-[19px] font-semibold tracking-tight">Your links</h2>
        <span className="text-[13px] text-muted tabular-nums">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="card grid place-items-center gap-2 px-6 py-12 text-center">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-soft text-link">
            <LinkIcon size={22} />
          </span>
          <p className="font-medium">No links yet</p>
          <p className="text-sm text-muted">Paste one above and it will show up here.</p>
        </div>
      ) : (
        <ul className="card divide-y divide-line overflow-hidden p-1.5">
          {rows.map((l) => {
            const short = shortUrl(l.slug);
            const stats = `/dashboard/links/${l.id}`;
            return (
              <li key={l.id} className="flex flex-wrap items-center gap-x-3.5 gap-y-2 rounded-2xl px-3 py-3 transition hover:bg-hover sm:flex-nowrap">
                <LinkAvatar url={l.url} />
                <div className="min-w-0 flex-1 basis-48">
                  <div className="flex items-center gap-2">
                    <Link href={stats} className="truncate font-medium hover:underline">
                      {l.title || prettyUrl(short)}
                    </Link>
                    {l.disabledAt && (
                      <span className="shrink-0 rounded-full bg-danger/12 px-2 py-0.5 text-[11px] font-semibold text-danger">Disabled by admin</span>
                    )}
                  </div>
                  <p className="truncate text-[13px] text-muted">
                    <a href={short} target="_blank" rel="noreferrer" className="font-mono text-link">
                      {prettyUrl(short)}
                    </a>
                    <span className="mx-1.5">→</span>
                    <span title={l.url}>{prettyUrl(l.url)}</span>
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-display text-[17px] leading-tight font-semibold tabular-nums">{formatNumber(l.clickCount)}</p>
                    <p className="text-[11px] text-muted tabular-nums">
                      {l.todayClicks > 0 ? <span className="font-semibold text-link">+{formatNumber(l.todayClicks)} today</span> : formatDate(l.createdAt)}
                    </p>
                  </div>
                  <CopyButton text={short} iconOnly />
                  <Link href={stats} className="btn-ghost h-9 w-9 px-0" aria-label={`Stats for ${prettyUrl(short)}`} title="Stats">
                    <ChevronRightIcon size={16} />
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
      <div className={STAT_GRID}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="card h-[108px] animate-pulse" />
        ))}
      </div>
      <div className="card h-64 animate-pulse" />
    </div>
  );
}
