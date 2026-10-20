import "server-only";
import { and, count, desc, eq, gte, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clickDaily, clicks, links } from "@/db/schema";
import { RAW_CLICK_DAYS } from "./rollup";

export type Breakdown = { label: string; count: number }[];
export type DailyPoint = { date: string; count: number };

export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];

export function parseRange(value: string | string[] | undefined): RangeDays {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
}

/**
 * Stats cover whole UTC days: today plus the days before it, matching the chart.
 * Recent days live as single rows in clicks; days older than RAW_CLICK_DAYS
 * have been folded into click_daily, which has the same columns plus a count.
 * A day is only ever in one of the two, so every number below is the sum of both.
 */
type Scope = { userId: number } | { linkId: number };

function firstDay(days: number): SQL {
  return sql`UTC_DATE() - INTERVAL ${days - 1} DAY`;
}

function rawWhere(scope: Scope, days: number) {
  const owner = "linkId" in scope ? eq(clicks.linkId, scope.linkId) : eq(links.userId, scope.userId);
  return and(owner, gte(clicks.clickedAt, firstDay(days)));
}

function dailyWhere(scope: Scope, days: number) {
  const owner = "linkId" in scope ? eq(clickDaily.linkId, scope.linkId) : eq(links.userId, scope.userId);
  return and(owner, gte(clickDaily.day, firstDay(days)));
}

const clickDailySum = sql<number>`SUM(${clickDaily.clicks})`.mapWith(Number);

/** Each dashboard breakdown, as its column in clicks and in click_daily. */
const DIMENSIONS = {
  country: [clicks.country, clickDaily.country],
  platform: [clicks.platform, clickDaily.platform],
  device: [clicks.device, clickDaily.device],
  os: [clicks.os, clickDaily.os],
  browser: [clicks.browser, clickDaily.browser],
  referrer: [clicks.referrerHost, clickDaily.referrerHost],
} as const;
type Dimension = keyof typeof DIMENSIONS;

async function breakdown(dimension: Dimension, scope: Scope, days: number, limit = 8): Promise<Breakdown> {
  const [column, rolledColumn] = DIMENSIONS[dimension];
  const [raw, rolled] = await Promise.all([
    db
      .select({ label: column, count: count() })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rawWhere(scope, days))
      .groupBy(column),
    days > RAW_CLICK_DAYS
      ? db
          .select({ label: rolledColumn, count: clickDailySum })
          .from(clickDaily)
          .innerJoin(links, eq(clickDaily.linkId, links.id))
          .where(dailyWhere(scope, days))
          .groupBy(rolledColumn)
      : [],
  ]);

  // click_daily stores a missing value as "", the clicks table as NULL.
  const totals = new Map<string, number>();
  for (const r of [...raw, ...rolled]) {
    const label = r.label || "Unknown";
    totals.set(label, (totals.get(label) ?? 0) + r.count);
  }
  return [...totals]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

async function daily(scope: Scope, days: number): Promise<DailyPoint[]> {
  const rawDay = sql<string>`DATE_FORMAT(${clicks.clickedAt}, '%Y-%m-%d')`;
  const rolledDay = sql<string>`DATE_FORMAT(${clickDaily.day}, '%Y-%m-%d')`;
  const [raw, rolled] = await Promise.all([
    db
      .select({ day: rawDay.as("day"), count: count() })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(rawWhere(scope, days))
      .groupBy(sql`day`),
    days > RAW_CLICK_DAYS
      ? db
          .select({ day: rolledDay.as("day"), count: clickDailySum })
          .from(clickDaily)
          .innerJoin(links, eq(clickDaily.linkId, links.id))
          .where(dailyWhere(scope, days))
          .groupBy(sql`day`)
      : [],
  ]);

  // Fill in days with zero clicks so the chart has no gaps.
  const byDay = new Map<string, number>();
  for (const r of [...raw, ...rolled]) byDay.set(r.day, (byDay.get(r.day) ?? 0) + r.count);
  const out: DailyPoint[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, count: byDay.get(key) ?? 0 });
  }
  return out;
}

function sumOf(series: DailyPoint[]) {
  return series.reduce((total, p) => total + p.count, 0);
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
  const scope = { userId };

  const [[totals], countries, platforms, series] = await Promise.all([
    db
      .select({ links: count(), clicks: sql<number>`COALESCE(SUM(${links.clickCount}), 0)`.mapWith(Number) })
      .from(links)
      .where(eq(links.userId, userId)),
    breakdown("country", scope, days, 6),
    breakdown("platform", scope, days, 6),
    daily(scope, days),
  ]);

  return {
    totalLinks: totals.links,
    totalClicks: totals.clicks,
    rangeClicks: sumOf(series),
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

  const scope = { linkId };

  const [series, countries, platforms, devices, os, browsers, referrers] = await Promise.all([
    daily(scope, days),
    breakdown("country", scope, days, 10),
    breakdown("platform", scope, days, 10),
    breakdown("device", scope, days, 6),
    breakdown("os", scope, days, 8),
    breakdown("browser", scope, days, 8),
    breakdown("referrer", scope, days, 8),
  ]);

  return { link, rangeClicks: sumOf(series), series, countries, platforms, devices, os, browsers, referrers };
}
