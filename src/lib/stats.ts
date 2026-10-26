import "server-only";
import { and, count, desc, eq, gte, inArray, sql, type SQL } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { clicks, links } from "@/db/schema";
import { startOfDay, type Zone } from "./timezone";

export type Breakdown = { label: string; count: number }[];
/** One bar on the clicks chart: a day, or an hour when the range is today. */
export type ChartPoint = { key: string; label: string; count: number; visitors: number };

/** 1 means today. Every range is whole days in the viewer's time zone, ending today. */
export const RANGES = [1, 7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

export function rangeLabel(days: RangeDays) {
  return days === 1 ? "Today" : `Last ${days} days`;
}

/**
 * Unique visitors among the clicks that match `when` (all of them if omitted):
 * distinct visitor ids, plus each click from before ids were recorded, since
 * those can't be told apart.
 */
function visitors(when?: SQL) {
  const id = when ? sql`IF(${when}, ${clicks.visitorId}, NULL)` : sql`${clicks.visitorId}`;
  const legacy = when ? sql`${when} AND ${clicks.visitorId} IS NULL` : sql`${clicks.visitorId} IS NULL`;
  return sql<number>`COUNT(DISTINCT ${id}) + COALESCE(SUM(${legacy}), 0)`.mapWith(Number);
}

/** Clicks and unique visitors for the range, and for today within it. */
async function totals(where: SQL | undefined, zone: Zone) {
  const isToday = gte(clicks.clickedAt, startOfDay(zone));
  const [row] = await db
    .select({
      clicks: count(),
      visitors: visitors(),
      todayClicks: sql<number>`COALESCE(SUM(${isToday}), 0)`.mapWith(Number),
      todayVisitors: visitors(isToday),
    })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(where);
  return row;
}

async function breakdown(column: MySqlColumn, where: SQL | undefined, limit = 8): Promise<Breakdown> {
  const rows = await db
    .select({ label: column, count: count() })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(where)
    .groupBy(column)
    .orderBy(desc(count()))
    .limit(limit);
  return rows.map((r) => ({ label: (r.label as string | null) ?? "Unknown", count: r.count }));
}

/** Clicks per day in the viewer's zone, or per hour of today when the range is one day. */
async function chartSeries(where: SQL | undefined, days: number, zone: Zone): Promise<ChartPoint[]> {
  const localTime = sql`CONVERT_TZ(${clicks.clickedAt}, '+00:00', ${zone.sqlOffset})`;
  const bucket = days === 1 ? sql<string>`LPAD(HOUR(${localTime}), 2, '0')` : sql<string>`DATE_FORMAT(${localTime}, '%Y-%m-%d')`;

  const rows = await db
    .select({ key: bucket.as("bucket"), count: count(), visitors: visitors() })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(where)
    .groupBy(sql`bucket`);
  const byKey = new Map(rows.map((r) => [r.key, r]));
  const point = (key: string, label: string) => ({ key, label, count: byKey.get(key)?.count ?? 0, visitors: byKey.get(key)?.visitors ?? 0 });

  // Fill in empty hours or days so the chart has no gaps.
  if (days === 1) {
    return Array.from({ length: 24 }, (_, h) => {
      const key = String(h).padStart(2, "0");
      return point(key, `${key}:00`);
    });
  }
  const fmt = new Intl.DateTimeFormat("en", { day: "numeric", month: "short", timeZone: "UTC" });
  const out: ChartPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    // Shift the UTC instant of local midnight by the offset to read the local calendar date.
    const local = new Date(startOfDay(zone, i).getTime() + zone.offsetMinutes * 60_000);
    const key = local.toISOString().slice(0, 10);
    out.push(point(key, fmt.format(local)));
  }
  return out;
}

/** All of a user's links, newest first, with how many clicks each got today. */
export async function getUserLinks(userId: number, zone: Zone) {
  const rows = await db
    .select({
      id: links.id,
      slug: links.slug,
      url: links.url,
      title: links.title,
      clickCount: links.clickCount,
      createdAt: links.createdAt,
    })
    .from(links)
    .where(eq(links.userId, userId))
    .orderBy(desc(links.createdAt))
    .limit(500);
  if (rows.length === 0) return [];

  const today = await db
    .select({ linkId: clicks.linkId, count: count() })
    .from(clicks)
    .where(and(inArray(clicks.linkId, rows.map((r) => r.id)), gte(clicks.clickedAt, startOfDay(zone))))
    .groupBy(clicks.linkId);
  const todayById = new Map(today.map((t) => [t.linkId, t.count]));

  return rows.map((r) => ({ ...r, todayClicks: todayById.get(r.id) ?? 0 }));
}

/** Totals and top countries/platforms across every link the user owns. */
export async function getUserOverview(userId: number, days: RangeDays, zone: Zone) {
  const mine = eq(links.userId, userId);
  const inRange = and(mine, gte(clicks.clickedAt, startOfDay(zone, days - 1)));

  const [[all], range, countries, platforms, series] = await Promise.all([
    db
      .select({ links: count(), clicks: sql<number>`COALESCE(SUM(${links.clickCount}), 0)`.mapWith(Number) })
      .from(links)
      .where(mine),
    totals(inRange, zone),
    breakdown(clicks.country, inRange, 6),
    breakdown(clicks.platform, inRange, 6),
    chartSeries(inRange, days, zone),
  ]);

  return {
    totalLinks: all.links,
    totalClicks: all.clicks,
    todayClicks: range.todayClicks,
    todayVisitors: range.todayVisitors,
    rangeClicks: range.clicks,
    rangeVisitors: range.visitors,
    countries,
    platforms,
    series,
  };
}

/** Full stats for one link. Returns null when the link doesn't belong to this user. */
export async function getLinkStats(userId: number, linkId: number, days: RangeDays, zone: Zone) {
  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);
  if (!link) return null;

  const inRange = and(eq(clicks.linkId, linkId), gte(clicks.clickedAt, startOfDay(zone, days - 1)));

  const [[allTime], range, series, countries, platforms, devices, os, browsers, referrers] = await Promise.all([
    db.select({ visitors: visitors() }).from(clicks).where(eq(clicks.linkId, linkId)),
    totals(inRange, zone),
    chartSeries(inRange, days, zone),
    breakdown(clicks.country, inRange, 10),
    breakdown(clicks.platform, inRange, 10),
    breakdown(clicks.device, inRange, 6),
    breakdown(clicks.os, inRange, 8),
    breakdown(clicks.browser, inRange, 8),
    breakdown(clicks.referrerHost, inRange, 8),
  ]);

  return {
    link,
    allTimeVisitors: allTime.visitors,
    todayClicks: range.todayClicks,
    todayVisitors: range.todayVisitors,
    rangeClicks: range.clicks,
    rangeVisitors: range.visitors,
    series,
    countries,
    platforms,
    devices,
    os,
    browsers,
    referrers,
  };
}
