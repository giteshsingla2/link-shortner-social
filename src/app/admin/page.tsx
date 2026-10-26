import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { gte } from "drizzle-orm";
import { LinksTable, UsersTable } from "@/components/admin/tables";
import { BarList, STAT_GRID, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CalendarIcon, ChevronRightIcon, CursorIcon, LinkIcon, PeopleIcon, SunIcon } from "@/components/icons";
import { RangeTabs } from "@/components/range-tabs";
import { Toolbar } from "@/components/toolbar";
import { clicks } from "@/db/schema";
import { getSiteTotals, getTopLinksToday, getUsersWithStats } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { countryLabel, formatChange, formatNumber } from "@/lib/format";
import { breakdown, chartSeries, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone, startOfDay } from "@/lib/timezone";

export const metadata: Metadata = { title: "Admin · Shortly" };

type SearchParams = PageProps<"/admin">["searchParams"];

function visitors(n: number) {
  return `${formatNumber(n)} unique ${n === 1 ? "visitor" : "visitors"}`;
}

export default function AdminOverviewPage({ searchParams }: PageProps<"/admin">) {
  return (
    <>
      <Toolbar title="Overview" subtitle="Admin · everything happening on Shortly">
        <Suspense fallback={<div className="h-8 w-48 animate-pulse rounded-full bg-hover" />}>
          <Range searchParams={searchParams} />
        </Suspense>
      </Toolbar>
      <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <Suspense fallback={<div className="card h-96 animate-pulse" />}>
          <Overview searchParams={searchParams} />
        </Suspense>
      </div>
    </>
  );
}

async function Range({ searchParams }: { searchParams: SearchParams }) {
  return <RangeTabs basePath="/admin" current={parseRange((await searchParams).range)} />;
}

async function Overview({ searchParams }: { searchParams: SearchParams }) {
  await requireAdmin();
  const range = parseRange((await searchParams).range);
  const zone = await getViewerZone();
  const inRange = gte(clicks.clickedAt, startOfDay(zone, range - 1));

  const [t, series, countries, platforms, users, topLinks] = await Promise.all([
    getSiteTotals(zone),
    chartSeries(inRange, range, zone),
    breakdown(clicks.country, inRange, 6),
    breakdown(clicks.platform, inRange, 6),
    getUsersWithStats({ zone, sort: "today" }),
    getTopLinksToday(zone),
  ]);
  const change = formatChange(t.today, t.yesterday);
  const rangeClicks = series.reduce((sum, p) => sum + p.count, 0);

  return (
    <>
      <div className={STAT_GRID}>
        <StatCard
          icon={<PeopleIcon size={15} />}
          tint="blue"
          label="Users"
          value={formatNumber(t.users)}
          hint={`+${formatNumber(t.newUsersToday)} today${t.suspendedUsers ? ` · ${t.suspendedUsers} suspended` : ""}`}
        />
        <StatCard
          icon={<LinkIcon size={15} />}
          tint="purple"
          label="Links"
          value={formatNumber(t.links)}
          hint={`+${formatNumber(t.newLinksToday)} today${t.disabledLinks ? ` · ${t.disabledLinks} disabled` : ""}`}
        />
        <StatCard icon={<CursorIcon size={15} />} tint="orange" label="All-time clicks" value={formatNumber(t.totalClicks)} hint="Every link, every user" />
        <StatCard
          icon={<SunIcon size={15} />}
          tint="gold"
          label="Clicks today"
          value={formatNumber(t.today)}
          hint={`${visitors(t.todayVisitors)}${change ? ` · ${change} vs yesterday` : ""}`}
        />
        <StatCard icon={<CalendarIcon size={15} />} tint="rose" label="Clicks yesterday" value={formatNumber(t.yesterday)} hint={visitors(t.yesterdayVisitors)} />
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[13px] text-muted">
          {rangeLabel(range)}: <span className="font-semibold text-ink tabular-nums">{formatNumber(rangeClicks)}</span> clicks across the site
        </p>
        <ClicksChart data={series} unit={range === 1 ? "hour" : "day"} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <BarList title="Top countries" data={countries} formatLabel={countryLabel} />
        <BarList title="Top platforms" data={platforms} />
      </div>

      <section className="space-y-3">
        <SectionHeader title="Users: today vs yesterday" href="/admin/users" cta={`All ${formatNumber(t.users)} users`} />
        <UsersTable rows={users.slice(0, 25)} empty="No users yet." />
      </section>

      <section className="space-y-3">
        <SectionHeader title="Top links today" href="/admin/links?sort=today" cta="All links" />
        <LinksTable rows={topLinks} back="/admin" empty="No clicks on any link yet today." />
      </section>
    </>
  );
}

function SectionHeader({ title, href, cta }: { title: string; href: string; cta: string }) {
  return (
    <div className="flex items-baseline justify-between px-1">
      <h2 className="font-display text-[19px] font-semibold tracking-tight">{title}</h2>
      <Link href={href} className="inline-flex items-center gap-0.5 text-[13px] font-medium text-link hover:underline">
        {cta}
        <ChevronRightIcon size={14} />
      </Link>
    </div>
  );
}
