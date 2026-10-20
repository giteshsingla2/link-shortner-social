import {
  bigint,
  char,
  date,
  datetime,
  index,
  int,
  mysqlTable,
  primaryKey,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

export const users = mysqlTable(
  "users",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [uniqueIndex("users_email_unique").on(t.email)],
);

export const links = mysqlTable(
  "links",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    userId: bigint("user_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    slug: varchar("slug", { length: 64 }).notNull(),
    url: varchar("url", { length: 2048 }).notNull(),
    title: varchar("title", { length: 255 }),
    // Running total so the dashboard list doesn't count rows on every load.
    clickCount: int("click_count", { unsigned: true }).notNull().default(0),
    createdAt: timestamp("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => [
    uniqueIndex("links_slug_unique").on(t.slug),
    index("links_user_idx").on(t.userId, t.createdAt),
  ],
);

export const clicks = mysqlTable(
  "clicks",
  {
    id: bigint("id", { mode: "number", unsigned: true }).autoincrement().primaryKey(),
    linkId: bigint("link_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    clickedAt: datetime("clicked_at").notNull().default(sql`CURRENT_TIMESTAMP`),
    country: char("country", { length: 2 }),
    platform: varchar("platform", { length: 32 }).notNull(),
    device: varchar("device", { length: 16 }).notNull(),
    os: varchar("os", { length: 32 }).notNull(),
    browser: varchar("browser", { length: 32 }).notNull(),
    referrerHost: varchar("referrer_host", { length: 255 }),
  },
  (t) => [index("clicks_link_time_idx").on(t.linkId, t.clickedAt)],
);

/**
 * Clicks older than RAW_CLICK_DAYS are folded into this table by
 * src/lib/rollup.ts, so the clicks table stops growing forever. One row per
 * link, day and combination of the click columns, with how many clicks had
 * exactly that combination, e.g. (42, "2026-09-01", "IN", "Instagram",
 * "Mobile", "Android", "Instagram", "", 52). Only the time of day is lost.
 * A missing country or referrer is stored as "" so it can be part of the key.
 */
export const clickDaily = mysqlTable(
  "click_daily",
  {
    linkId: bigint("link_id", { mode: "number", unsigned: true })
      .notNull()
      .references(() => links.id, { onDelete: "cascade" }),
    day: date("day", { mode: "string" }).notNull(),
    country: char("country", { length: 2 }).notNull().default(""),
    platform: varchar("platform", { length: 32 }).notNull(),
    device: varchar("device", { length: 16 }).notNull(),
    os: varchar("os", { length: 32 }).notNull(),
    browser: varchar("browser", { length: 32 }).notNull(),
    referrerHost: varchar("referrer_host", { length: 255 }).notNull().default(""),
    clicks: int("clicks", { unsigned: true }).notNull(),
  },
  (t) => [
    primaryKey({
      name: "click_daily_pk",
      columns: [t.linkId, t.day, t.country, t.platform, t.device, t.os, t.browser, t.referrerHost],
    }),
  ],
);

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
