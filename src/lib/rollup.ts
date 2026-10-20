import "server-only";
import { sql } from "drizzle-orm";
import { db } from "@/db";

/**
 * Single clicks are kept this many days (plus today). Older days are folded
 * into click_daily, one row per combination of the click columns, and the
 * single rows are deleted. So the clicks table holds about a week of rows,
 * and older history keeps every breakdown, only losing the time of day.
 */
export const RAW_CLICK_DAYS = 7;

const HOUR_MS = 60 * 60 * 1000;
// Upper bound per run so a broken delete can't spin forever.
const MAX_DAYS_PER_RUN = 400;

async function oldestRawDay(): Promise<string | null> {
  const [rows] = (await db.execute(sql`
    SELECT DATE_FORMAT(MIN(clicked_at), '%Y-%m-%d') AS day
    FROM clicks
    WHERE clicked_at < UTC_DATE() - INTERVAL ${RAW_CLICK_DAYS} DAY
  `)) as unknown as [{ day: string | null }[]];
  return rows[0]?.day ?? null;
}

/** Folds one UTC day of clicks into click_daily and deletes them, all or nothing. */
async function rollupDay(day: string) {
  const start = sql`CAST(${day} AS DATE)`;
  const inDay = sql`clicked_at >= ${start} AND clicked_at < ${start} + INTERVAL 1 DAY`;

  await db.transaction(async (tx) => {
    await tx.execute(sql`
      INSERT INTO click_daily (link_id, day, country, platform, device, os, browser, referrer_host, clicks)
      SELECT * FROM (
        SELECT link_id, ${start} AS day, COALESCE(country, '') AS c, platform, device, os, browser,
          COALESCE(referrer_host, '') AS r, COUNT(*) AS n
        FROM clicks
        WHERE ${inDay}
        GROUP BY link_id, c, platform, device, os, browser, r
      ) AS t
      ON DUPLICATE KEY UPDATE clicks = click_daily.clicks + t.n
    `);
    await tx.execute(sql`DELETE FROM clicks WHERE ${inDay}`);
  });
}

let running = false;

/** Rolls up every day that has aged out of the raw window. Safe to call any time. */
export async function rollupOldClicks() {
  if (running) return;
  running = true;
  try {
    for (let i = 0; i < MAX_DAYS_PER_RUN; i++) {
      const day = await oldestRawDay();
      if (!day) break;
      await rollupDay(day);
    }
  } finally {
    running = false;
  }
}

/** Runs the rollup now and then hourly. Called once at server start from src/instrumentation.ts. */
export function startClickRollup() {
  const g = globalThis as unknown as { clickRollupTimer?: NodeJS.Timeout };
  if (g.clickRollupTimer) return;

  const run = () => rollupOldClicks().catch((err) => console.error("Click rollup failed", err));
  run();
  g.clickRollupTimer = setInterval(run, HOUR_MS);
  g.clickRollupTimer.unref();
}
