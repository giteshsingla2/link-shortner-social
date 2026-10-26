import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { adminDeleteLink } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/admin/controls";
import { ClicksTable, LinkStateButton } from "@/components/admin/tables";
import { BarList, STAT_GRID, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CopyButton } from "@/components/copy-button";
import { AppsIcon, CalendarIcon, CursorIcon, GlobeIcon, SunIcon, TrashIcon } from "@/components/icons";
import { LinkAvatar } from "@/components/link-avatar";
import { RangeTabs } from "@/components/range-tabs";
import { Toolbar } from "@/components/toolbar";
import { getLinkOwner, getRecentClicks } from "@/lib/admin-stats";
import { requireAdmin } from "@/lib/auth";
import { countryLabel, countryName, formatDate, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";
import { getLinkStats, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "Link · Admin · Shortly" };

function visitors(n: number) {
  return `${formatNumber(n)} unique ${n === 1 ? "visitor" : "visitors"}`;
}

export default function AdminLinkPage(props: PageProps<"/admin/links/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Toolbar title="Link" backHref="/admin/links" />
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="card h-96 animate-pulse" />
          </div>
        </>
      }
    >
      <LinkDetail {...props} />
    </Suspense>
  );
}

async function LinkDetail({ params, searchParams }: PageProps<"/admin/links/[id]">) {
  await requireAdmin();
  const linkId = Number((await params).id);
  if (!Number.isInteger(linkId)) notFound();
  const range = parseRange((await searchParams).range);
  const zone = await getViewerZone();

  const owner = await getLinkOwner(linkId);
  if (!owner) notFound();
  const [s, recent] = await Promise.all([getLinkStats(owner.ownerId, linkId, range, zone), getRecentClicks({ zone, linkId, limit: 25 })]);
  if (!s) notFound();

  const short = shortUrl(s.link.slug);
  const label = prettyUrl(short);

  return (
    <>
      <Toolbar title={s.link.title || label} subtitle={`Created ${formatDate(s.link.createdAt)} by ${owner.ownerEmail}`} backHref="/admin/links">
        <RangeTabs basePath={`/admin/links/${linkId}`} current={range} />
      </Toolbar>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <section className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <LinkAvatar url={s.link.url} size={52} />
            <div className="min-w-0 space-y-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <a href={short} target="_blank" rel="noreferrer" className="truncate font-mono text-xl font-semibold tracking-tight text-link">
                  {label}
                </a>
                {s.link.disabledAt ? <Badge tone="red">Disabled {formatDate(s.link.disabledAt)}</Badge> : <Badge tone="green">Live</Badge>}
                {owner.ownerSuspendedAt && <Badge tone="gray">Owner suspended</Badge>}
              </div>
              <p className="truncate text-sm text-muted">
                Goes to{" "}
                <a href={s.link.url} target="_blank" rel="noreferrer" className="text-ink underline decoration-line underline-offset-2">
                  {prettyUrl(s.link.url)}
                </a>
              </p>
              <p className="truncate text-sm text-muted">
                Owner{" "}
                <Link href={`/admin/users/${owner.ownerId}`} className="font-medium text-ink hover:underline">
                  {owner.ownerName} ({owner.ownerEmail})
                </Link>
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 border-t border-line pt-4">
            <CopyButton text={short} />
            <LinkStateButton id={linkId} disabled={Boolean(s.link.disabledAt)} label={label} compact={false} />
            <ActionButton
              action={adminDeleteLink}
              fields={{ id: linkId, redirectTo: "/admin/links" }}
              confirm={`Delete ${label}? It stops working and its clicks and stats are removed. This can't be undone.`}
              className="btn-ghost text-danger"
            >
              <TrashIcon size={15} />
              Delete
            </ActionButton>
          </div>
        </section>

        <div className={STAT_GRID}>
          <StatCard icon={<CursorIcon size={15} />} tint="orange" label="All-time clicks" value={formatNumber(s.link.clickCount)} hint={visitors(s.allTimeVisitors)} />
          <StatCard icon={<SunIcon size={15} />} tint="gold" label="Today" value={formatNumber(s.todayClicks)} hint={visitors(s.todayVisitors)} />
          {range !== 1 && <StatCard icon={<CalendarIcon size={15} />} tint="rose" label={rangeLabel(range)} value={formatNumber(s.rangeClicks)} hint={visitors(s.rangeVisitors)} />}
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

        <section className="space-y-3">
          <h2 className="px-1 font-display text-[19px] font-semibold tracking-tight">Latest clicks</h2>
          <ClicksTable rows={recent} timeZone={zone.name} showLink={false} empty="No clicks on this link yet." />
        </section>
      </div>
    </>
  );
}
