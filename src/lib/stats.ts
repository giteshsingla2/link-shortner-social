import "server-only";
import { and, count, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import type { MySqlColumn } from "drizzle-orm/mysql-core";
import { db } from "@/db";
import { clicks, links } from "@/db/schema";

export type Breakdown = { label: string; count: number }[];
export type DailyPoint = { date: string; count: number };

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

function since(days: number): SQL {
  return sql`UTC_TIMESTAMP() - INTERVAL ${days} DAY`;
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

async function daily(where: SQL | undefined, days: number): Promise<DailyPoint[]> {
  const rows = await db
    .select({ day: sql<string>`DATE_FORMAT(${clicks.clickedAt}, '%Y-%m-%d')`.as("day"), count: count() })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .where(where)
    .groupBy(sql`day`)
    .orderBy(sql`day`);

  // Fill in days with zero clicks so the chart has no gaps.
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: DailyPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

/** All of a user's links, newest first. */
export async function getUserLinks(userId: number) {
  return db
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
}

/** Totals and top countries/platforms across every link the user owns. */
export async function getUserOverview(userId: number, days: RangeDays) {
  const inRange = and(eq(links.userId, userId), gte(clicks.clickedAt, since(days)));

  const [[totals], [rangeTotal], countries, platforms, series] = await Promise.all([
    db
      .select({ links: count(), clicks: sql<number>`COALESCE(SUM(${links.clickCount}), 0)`.mapWith(Number) })
      .from(links)
      .where(eq(links.userId, userId)),
    db
      .select({ clicks: count() })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(inRange),
    breakdown(clicks.country, inRange, 6),
    breakdown(clicks.platform, inRange, 6),
    daily(inRange, days),
  ]);

  return {
    totalLinks: totals.links,
    totalClicks: totals.clicks,
    rangeClicks: rangeTotal.clicks,
    countries,
    platforms,
    series,
  };
}

/** Full stats for one link. Returns null when the link doesn't belong to this user. */
export async function getLinkStats(userId: number, linkId: number, days: RangeDays) {
  const [link] = await db
    .select()
    .from(links)
    .where(and(eq(links.id, linkId), eq(links.userId, userId)))
    .limit(1);
  if (!link) return null;

  const inRange = and(eq(clicks.linkId, linkId), gte(clicks.clickedAt, since(days)));

  const [[rangeTotal], series, countries, platforms, devices, os, browsers, referrers] = await Promise.all([
    db.select({ clicks: count() }).from(clicks).where(inRange),
    daily(inRange, days),
    breakdown(clicks.country, inRange, 10),
    breakdown(clicks.platform, inRange, 10),
    breakdown(clicks.device, inRange, 6),
    breakdown(clicks.os, inRange, 8),
    breakdown(clicks.browser, inRange, 8),
    breakdown(clicks.referrerHost, inRange, 8),
  ]);

  return { link, rangeClicks: rangeTotal.clicks, series, countries, platforms, devices, os, browsers, referrers };
}
