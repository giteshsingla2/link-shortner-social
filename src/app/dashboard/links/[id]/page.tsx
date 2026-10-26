import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteLink } from "@/app/actions/links";
import { BarList, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CopyButton } from "@/components/copy-button";
import { LinkHeader } from "@/components/link-header";
import { RangeTabs } from "@/components/range-tabs";
import { getCurrentUser } from "@/lib/auth";
import { getLinkStats, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";
import { countryName, formatDate, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Link stats · Shortly" };

export default function LinkStatsPage(props: PageProps<"/dashboard/links/[id]">) {
  return (
    <div className="space-y-6">
      <Link href="/dashboard" className="text-sm font-medium text-muted hover:text-ink">
        ← All links
      </Link>
      <Suspense fallback={<div className="card h-96 animate-pulse" />}>
        <Stats {...props} />
      </Suspense>
    </div>
  );
}

async function Stats({ params, searchParams }: PageProps<"/dashboard/links/[id]">) {
  const user = await getCurrentUser();
  const { id } = await params;
  const range = parseRange((await searchParams).range);
  const linkId = Number(id);
  if (!Number.isInteger(linkId)) notFound();

  const s = await getLinkStats(user.id, linkId, range, await getViewerZone());
  if (!s) notFound();

  const short = shortUrl(s.link.slug);
  const basePath = `/dashboard/links/${s.link.id}`;

  return (
    <div className="space-y-6">
      <LinkHeader
        link={{ id: s.link.id, url: s.link.url, title: s.link.title }}
        actions={
          <>
            <CopyButton text={short} />
            <form action={deleteLink}>
              <input type="hidden" name="id" value={s.link.id} />
              <input type="hidden" name="redirectTo" value="dashboard" />
              <button type="submit" className="btn-ghost text-danger">Delete</button>
            </form>
          </>
        }
      >
        {s.link.title && <h1 className="truncate text-xl font-semibold tracking-tight">{s.link.title}</h1>}
        <a href={short} target="_blank" rel="noreferrer" className="block truncate font-mono text-lg font-medium text-accent">
          {prettyUrl(short)}
        </a>
        <p className="truncate text-sm text-muted">
          Goes to{" "}
          <a href={s.link.url} target="_blank" rel="noreferrer" className="underline decoration-line underline-offset-2 hover:text-ink">
            {prettyUrl(s.link.url)}
          </a>
        </p>
        <p className="text-xs text-muted">Created {formatDate(s.link.createdAt)}</p>
      </LinkHeader>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold tracking-tight">Clicks</h2>
        <RangeTabs basePath={basePath} current={range} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-flow-col lg:grid-cols-none lg:auto-cols-fr">
        <StatCard label="All-time clicks" value={formatNumber(s.link.clickCount)} hint={`${formatNumber(s.allTimeVisitors)} unique ${s.allTimeVisitors === 1 ? "visitor" : "visitors"}`} />
        <StatCard label="Today" value={formatNumber(s.todayClicks)} hint={`${formatNumber(s.todayVisitors)} unique ${s.todayVisitors === 1 ? "visitor" : "visitors"}`} />
        {range !== 1 && <StatCard label={rangeLabel(range)} value={formatNumber(s.rangeClicks)} hint={`${formatNumber(s.rangeVisitors)} unique ${s.rangeVisitors === 1 ? "visitor" : "visitors"}`} />}
        <StatCard
          label="Top country"
          value={s.countries[0] ? countryName(s.countries[0].label) : "None yet"}
          hint={s.countries[0] ? `${formatNumber(s.countries[0].count)} clicks` : undefined}
        />
        <StatCard
          label="Top platform"
          value={s.platforms[0]?.label ?? "None yet"}
          hint={s.platforms[0] ? `${formatNumber(s.platforms[0].count)} clicks` : undefined}
        />
      </div>

      <ClicksChart data={s.series} unit={range === 1 ? "hour" : "day"} />

      <div className="grid gap-3 md:grid-cols-2">
        <BarList title="Countries" data={s.countries} formatLabel={countryName} />
        <BarList title="Platforms" data={s.platforms} />
        <BarList title="Devices" data={s.devices} />
        <BarList title="Operating systems" data={s.os} />
        <BarList title="Browsers" data={s.browsers} />
        <BarList title="Referring sites" data={s.referrers} formatLabel={(l) => (l === "Unknown" ? "None (direct or app)" : l)} />
      </div>
    </div>
  );
}
