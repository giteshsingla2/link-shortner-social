import "server-only";
import { and, count, desc, eq, gte, inArray, isNotNull, like, lt, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import { clicks, links, users } from "@/db/schema";
import { visitors } from "./stats";
import { startOfDay, type Zone } from "./timezone";

/**
 * Site-wide numbers for the admin panel. "Today" and "yesterday" are whole
 * days in the admin's own time zone, like the rest of the stats.
 */

function days(zone: Zone) {
  const today = startOfDay(zone);
  const yesterday = startOfDay(zone, 1);
  return {
    since: gte(clicks.clickedAt, yesterday),
    isToday: gte(clicks.clickedAt, today),
    isYesterday: and(gte(clicks.clickedAt, yesterday), lt(clicks.clickedAt, today))!,
    today,
  };
}

const sumIf = (cond: SQL) => sql<number>`COALESCE(SUM(${cond}), 0)`.mapWith(Number);

/** "50%" in a search box should match a literal %, not everything. */
function contains(text: string) {
  return `%${text.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

export async function getSiteTotals(zone: Zone) {
  const d = days(zone);
  const [[u], [l], [c]] = await Promise.all([
    db
      .select({
        users: count(),
        newToday: sumIf(gte(users.createdAt, d.today)),
        suspended: sumIf(isNotNull(users.suspendedAt)),
      })
      .from(users),
    db
      .select({
        links: count(),
        newToday: sumIf(gte(links.createdAt, d.today)),
        clicks: sql<number>`COALESCE(SUM(${links.clickCount}), 0)`.mapWith(Number),
        disabled: sumIf(isNotNull(links.disabledAt)),
      })
      .from(links),
    db
      .select({
        today: sumIf(d.isToday),
        yesterday: sumIf(d.isYesterday),
        todayVisitors: visitors(d.isToday),
        yesterdayVisitors: visitors(d.isYesterday),
      })
      .from(clicks)
      .where(d.since),
  ]);
  return {
    users: u.users,
    newUsersToday: u.newToday,
    suspendedUsers: u.suspended,
    links: l.links,
    newLinksToday: l.newToday,
    disabledLinks: l.disabled,
    totalClicks: l.clicks,
    ...c,
  };
}

export type UserSort = "today" | "yesterday" | "clicks" | "links" | "newest";

/** Every user (or those matching `q`) with their link count, all-time clicks, today and yesterday. */
export async function getUsersWithStats({ zone, q, sort = "today", limit = 2000 }: { zone: Zone; q?: string; sort?: UserSort; limit?: number }) {
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, suspendedAt: users.suspendedAt })
    .from(users)
    .where(q ? or(like(users.email, contains(q)), like(users.name, contains(q))) : undefined)
    .orderBy(desc(users.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const d = days(zone);
  const [perUserLinks, perUserDays] = await Promise.all([
    db
      .select({ userId: links.userId, links: count(), clicks: sql<number>`COALESCE(SUM(${links.clickCount}), 0)`.mapWith(Number) })
      .from(links)
      .where(inArray(links.userId, ids))
      .groupBy(links.userId),
    db
      .select({ userId: links.userId, today: sumIf(d.isToday), yesterday: sumIf(d.isYesterday) })
      .from(clicks)
      .innerJoin(links, eq(clicks.linkId, links.id))
      .where(and(d.since, inArray(links.userId, ids)))
      .groupBy(links.userId),
  ]);
  const linksByUser = new Map(perUserLinks.map((p) => [p.userId, p]));
  const byUser = new Map(perUserDays.map((p) => [p.userId, p]));

  const out = rows.map((r) => ({
    ...r,
    links: linksByUser.get(r.id)?.links ?? 0,
    clicks: linksByUser.get(r.id)?.clicks ?? 0,
    today: byUser.get(r.id)?.today ?? 0,
    yesterday: byUser.get(r.id)?.yesterday ?? 0,
  }));
  const key: Record<UserSort, (r: (typeof out)[number]) => number> = {
    today: (r) => r.today * 1e6 + r.yesterday,
    yesterday: (r) => r.yesterday,
    clicks: (r) => r.clicks,
    links: (r) => r.links,
    newest: (r) => new Date(r.createdAt).getTime(),
  };
  return out.sort((a, b) => key[sort](b) - key[sort](a));
}

export type LinkSort = "today" | "yesterday" | "clicks" | "newest";

/** Every link (or one user's, or those matching `q`) with its owner, all-time clicks, today and yesterday. */
export async function getLinksWithStats({
  zone,
  q,
  userId,
  ids,
  sort = "newest",
  limit = 500,
}: {
  zone: Zone;
  q?: string;
  userId?: number;
  ids?: number[];
  sort?: LinkSort;
  limit?: number;
}) {
  const search = q
    ? or(like(links.slug, contains(q)), like(links.url, contains(q)), like(links.title, contains(q)), like(users.email, contains(q)))
    : undefined;
  const rows = await db
    .select({
      id: links.id,
      slug: links.slug,
      url: links.url,
      title: links.title,
      clickCount: links.clickCount,
      createdAt: links.createdAt,
      disabledAt: links.disabledAt,
      ownerId: users.id,
      ownerName: users.name,
      ownerEmail: users.email,
      ownerSuspendedAt: users.suspendedAt,
    })
    .from(links)
    .innerJoin(users, eq(links.userId, users.id))
    .where(and(userId ? eq(links.userId, userId) : undefined, ids ? inArray(links.id, ids) : undefined, search))
    .orderBy(desc(links.createdAt))
    .limit(limit);
  if (rows.length === 0) return [];

  const d = days(zone);
  const perLink = await db
    .select({ linkId: clicks.linkId, today: sumIf(d.isToday), yesterday: sumIf(d.isYesterday) })
    .from(clicks)
    .where(and(d.since, inArray(clicks.linkId, rows.map((r) => r.id))))
    .groupBy(clicks.linkId);
  const byLink = new Map(perLink.map((p) => [p.linkId, p]));

  const out = rows.map((r) => ({ ...r, today: byLink.get(r.id)?.today ?? 0, yesterday: byLink.get(r.id)?.yesterday ?? 0 }));
  const key: Record<LinkSort, (r: (typeof out)[number]) => number> = {
    today: (r) => r.today * 1e6 + r.yesterday,
    yesterday: (r) => r.yesterday,
    clicks: (r) => r.clickCount,
    newest: (r) => new Date(r.createdAt).getTime(),
  };
  return out.sort((a, b) => key[sort](b) - key[sort](a));
}

/** The links with the most clicks today, across every user. */
export async function getTopLinksToday(zone: Zone, limit = 8) {
  const top = await db
    .select({ linkId: clicks.linkId })
    .from(clicks)
    .where(days(zone).isToday)
    .groupBy(clicks.linkId)
    .orderBy(desc(count()))
    .limit(limit);
  if (top.length === 0) return [];
  return getLinksWithStats({ zone, ids: top.map((t) => t.linkId), sort: "today" });
}

export type ClickDay = "all" | "today" | "yesterday";

/** The latest clicks across the whole site, newest first, with their link and its owner. */
export async function getRecentClicks({
  zone,
  q,
  day = "all",
  linkId,
  limit = 200,
}: {
  zone: Zone;
  q?: string;
  day?: ClickDay;
  linkId?: number;
  limit?: number;
}) {
  const d = days(zone);
  const when = day === "today" ? d.isToday : day === "yesterday" ? d.isYesterday : undefined;
  const search = q ? or(like(links.slug, contains(q)), like(links.title, contains(q)), like(users.email, contains(q))) : undefined;

  return db
    .select({
      id: clicks.id,
      clickedAt: clicks.clickedAt,
      country: clicks.country,
      platform: clicks.platform,
      device: clicks.device,
      os: clicks.os,
      browser: clicks.browser,
      referrerHost: clicks.referrerHost,
      linkId: links.id,
      slug: links.slug,
      title: links.title,
      ownerId: users.id,
      ownerEmail: users.email,
    })
    .from(clicks)
    .innerJoin(links, eq(clicks.linkId, links.id))
    .innerJoin(users, eq(links.userId, users.id))
    .where(and(when, search, linkId ? eq(clicks.linkId, linkId) : undefined))
    .orderBy(desc(clicks.clickedAt), desc(clicks.id))
    .limit(limit);
}

/** One user for the admin's user page, or null. */
export async function getUserForAdmin(userId: number) {
  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, createdAt: users.createdAt, suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return user ?? null;
}

/** The owner of a link, so the admin can open any link's stats. */
export async function getLinkOwner(linkId: number) {
  const [row] = await db
    .select({ ownerId: users.id, ownerName: users.name, ownerEmail: users.email, ownerSuspendedAt: users.suspendedAt })
    .from(links)
    .innerJoin(users, eq(links.userId, users.id))
    .where(eq(links.id, linkId))
    .limit(1);
  return row ?? null;
}
