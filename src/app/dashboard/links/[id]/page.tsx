import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { BarList, STAT_GRID, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CopyButton } from "@/components/copy-button";
import { DeleteLinkButton } from "@/components/delete-link-button";
import { AppsIcon, CalendarIcon, CursorIcon, GlobeIcon, SunIcon } from "@/components/icons";
import { LinkAvatar } from "@/components/link-avatar";
import { LinkHeader } from "@/components/link-header";
import { RangeTabs } from "@/components/range-tabs";
import { Toolbar } from "@/components/toolbar";
import { getCurrentUser } from "@/lib/auth";
import { getLinkStats, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";
import { countryLabel, countryName, formatDate, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";

export const metadata: Metadata = { title: "Link stats · Shortly" };

function visitors(n: number) {
  return `${formatNumber(n)} unique ${n === 1 ? "visitor" : "visitors"}`;
}

export default function LinkStatsPage(props: PageProps<"/dashboard/links/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Toolbar title="Link" backHref="/dashboard" />
          <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
            <div className="card h-32 animate-pulse" />
            <div className="card h-72 animate-pulse" />
          </div>
        </>
      }
    >
      <Stats {...props} />
    </Suspense>
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

  return (
    <>
      <Toolbar title={s.link.title || prettyUrl(short)} subtitle={`Created ${formatDate(s.link.createdAt)}`} backHref="/dashboard">
        <RangeTabs basePath={`/dashboard/links/${s.link.id}`} current={range} />
      </Toolbar>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {s.link.disabledAt && (
          <p role="status" className="card border-danger/30 px-5 py-3.5 text-sm text-danger">
            This link was disabled by the site&apos;s administrators on {formatDate(s.link.disabledAt)}. Visitors see a &quot;link disabled&quot; page instead of
            your destination, and clicks aren&apos;t counted.
          </p>
        )}
        <LinkHeader
          link={{ id: s.link.id, url: s.link.url, title: s.link.title }}
          actions={
            <>
              <CopyButton text={short} />
              <DeleteLinkButton id={s.link.id} label={prettyUrl(short)} />
            </>
          }
        >
          <LinkAvatar url={s.link.url} size={52} />
          <div className="min-w-0 space-y-0.5">
            <a href={short} target="_blank" rel="noreferrer" className="block truncate font-mono text-xl font-semibold tracking-tight text-link sm:text-2xl">
              {prettyUrl(short)}
            </a>
            <p className="truncate text-sm text-muted">
              Goes to{" "}
              <a href={s.link.url} target="_blank" rel="noreferrer" className="text-ink underline decoration-line underline-offset-2 hover:decoration-current">
                {prettyUrl(s.link.url)}
              </a>
            </p>
          </div>
        </LinkHeader>

        <div className={STAT_GRID}>
          <StatCard icon={<CursorIcon size={15} />} tint="orange" label="All-time clicks" value={formatNumber(s.link.clickCount)} hint={visitors(s.allTimeVisitors)} />
          <StatCard icon={<SunIcon size={15} />} tint="gold" label="Today" value={formatNumber(s.todayClicks)} hint={visitors(s.todayVisitors)} />
          {range !== 1 && (
            <StatCard icon={<CalendarIcon size={15} />} tint="rose" label={rangeLabel(range)} value={formatNumber(s.rangeClicks)} hint={visitors(s.rangeVisitors)} />
          )}
          <StatCard
            icon={<GlobeIcon size={15} />}
            tint="green"
            label="Top country"
            value={s.countries[0] ? countryName(s.countries[0].label) : "None yet"}
            hint={s.countries[0] ? `${formatNumber(s.countries[0].count)} clicks` : undefined}
          />
          <StatCard
            icon={<AppsIcon size={15} />}
            tint="purple"
            label="Top platform"
            value={s.platforms[0]?.label ?? "None yet"}
            hint={s.platforms[0] ? `${formatNumber(s.platforms[0].count)} clicks` : undefined}
          />
        </div>

        <ClicksChart data={s.series} unit={range === 1 ? "hour" : "day"} />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <BarList title="Countries" data={s.countries} formatLabel={countryLabel} />
          <BarList title="Platforms" data={s.platforms} />
          <BarList title="Referring sites" data={s.referrers} formatLabel={(l) => (l === "Unknown" ? "None (direct or app)" : l)} />
          <BarList title="Devices" data={s.devices} />
          <BarList title="Operating systems" data={s.os} />
          <BarList title="Browsers" data={s.browsers} />
        </div>
      </div>
    </>
  );
}
