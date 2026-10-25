import "server-only";
import { cookies } from "next/headers";

/** Set by <TimeZoneCookie /> from the browser's own time zone. */
const TZ_COOKIE = "tz";

/**
 * A time zone's offset from UTC right now. Stats use it so "today" and the
 * days on the chart start at the viewer's midnight, not UTC midnight.
 * Ranges use the current offset throughout, so in zones with daylight saving
 * a day can be an hour off around the switch. India and most of Asia don't switch.
 */
export type Zone = { name: string; offsetMinutes: number; sqlOffset: string };

export function zoneFor(name: string): Zone {
  try {
    const part = new Intl.DateTimeFormat("en-US", { timeZone: name, timeZoneName: "longOffset" })
      .formatToParts(new Date())
      .find((p) => p.type === "timeZoneName")?.value;
    // "GMT+05:30", "GMT-04:00", or plain "GMT" for UTC.
    const m = /GMT([+-])(\d{2}):(\d{2})/.exec(part ?? "");
    if (!m) return { name, offsetMinutes: 0, sqlOffset: "+00:00" };
    const minutes = Number(m[2]) * 60 + Number(m[3]);
    return { name, offsetMinutes: m[1] === "-" ? -minutes : minutes, sqlOffset: `${m[1]}${m[2]}:${m[3]}` };
  } catch {
    // Unknown zone name (old browser, edited cookie): fall back to UTC.
    return { name: "UTC", offsetMinutes: 0, sqlOffset: "+00:00" };
  }
}

export async function getViewerZone(): Promise<Zone> {
  const raw = (await cookies()).get(TZ_COOKIE)?.value;
  return zoneFor(raw ? decodeURIComponent(raw) : "UTC");
}

/** The UTC moment the viewer's day started, `daysAgo` days back (0 = today). */
export function startOfDay(zone: Zone, daysAgo = 0): Date {
  const local = new Date(Date.now() + zone.offsetMinutes * 60_000);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate() - daysAgo);
  return new Date(midnight - zone.offsetMinutes * 60_000);
}
