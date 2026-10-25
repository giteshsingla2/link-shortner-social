import {
  bigint,
  char,
  datetime,
  index,
  int,
  mysqlTable,
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

export type User = typeof users.$inferSelect;
export type Link = typeof links.$inferSelect;
