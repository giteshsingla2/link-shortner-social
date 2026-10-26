import { NextResponse, after, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { nanoid } from "nanoid";
import { db } from "@/db";
import { clicks, links } from "@/db/schema";
import { cacheKey, linkCache } from "@/lib/link-cache";
import { SLUG_PATTERN } from "@/lib/links";
import { isBotRequest, parseClick } from "@/lib/tracking";

const CACHE_TTL_MS = 60_000;
const CACHE_MAX_ENTRIES = 5_000;

async function findLink(slug: string) {
  const now = Date.now();
  const key = cacheKey(slug);
  const hit = linkCache.get(key);
  if (hit && hit.expires > now) return hit.id ? hit : null;

  const [row] = await db.select({ id: links.id, url: links.url }).from(links).where(eq(links.slug, slug)).limit(1);

  if (linkCache.size >= CACHE_MAX_ENTRIES) linkCache.delete(linkCache.keys().next().value!);
  // Misses are cached too, so someone hammering random slugs can't flood the database.
  linkCache.set(key, row ? { ...row, expires: now + CACHE_TTL_MS } : { id: 0, url: "", expires: now + CACHE_TTL_MS });
  return row ?? null;
}

/**
 * One person clicking a link over and over should count only a few times.
 * A cookie scoped to this link's path holds "count.windowEndSeconds", so we
 * can recognise repeat visits without storing anything about the visitor.
 */
const CAP_COOKIE = "v";
const CAP_WINDOW_S = 24 * 60 * 60;

function readClickCap(request: NextRequest, now: number) {
  const [count, until] = (request.cookies.get(CAP_COOKIE)?.value ?? "").split(".").map(Number);
  if (!until || until <= now) return { count: 0, until: now + CAP_WINDOW_S };
  return { count: count || 0, until };
}

/**
 * A random id per browser, shared by every link, so stats can count unique
 * visitors. It says nothing about the person; clearing cookies or a private
 * window gets a new one.
 */
const VISITOR_ID_COOKIE = "vid";
const VISITOR_ID_PATTERN = /^[A-Za-z0-9_-]{16}$/;
const VISITOR_ID_MAX_AGE_S = 365 * 24 * 60 * 60;

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;
  const notFound = NextResponse.redirect(new URL("/link-not-found", request.url), 302);

  if (!SLUG_PATTERN.test(slug)) return notFound;

  const link = await findLink(slug);
  if (!link) return notFound;

  // 302, not 301: browsers cache 301s and would skip us on repeat visits, losing those clicks.
  const response = NextResponse.redirect(link.url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "unsafe-url");

  const userAgent = request.headers.get("user-agent") ?? "";
  if (isBotRequest(userAgent)) return response;

  const secure = (process.env.NEXT_PUBLIC_APP_URL ?? "").startsWith("https://");
  const cookie = { httpOnly: true, secure, sameSite: "lax" as const };

  let visitorId = request.cookies.get(VISITOR_ID_COOKIE)?.value ?? "";
  if (!VISITOR_ID_PATTERN.test(visitorId)) {
    visitorId = nanoid(16);
    response.cookies.set(VISITOR_ID_COOKIE, visitorId, { ...cookie, path: "/", maxAge: VISITOR_ID_MAX_AGE_S });
  }

  const now = Math.floor(Date.now() / 1000);
  const cap = readClickCap(request, now);
  const perVisitor = Number(process.env.CLICKS_PER_VISITOR) || 3;
  if (cap.count >= perVisitor) return response;

  response.cookies.set(CAP_COOKIE, `${cap.count + 1}.${cap.until}`, { ...cookie, path: `/${slug}`, maxAge: cap.until - now });

  // Read everything we need from the request now, then log after the redirect is sent.
  const info = parseClick(request.headers);
  after(async () => {
    try {
      await db.insert(clicks).values({ linkId: link.id, visitorId, ...info });
      await db
        .update(links)
        .set({ clickCount: sql`${links.clickCount} + 1` })
        .where(eq(links.id, link.id));
    } catch (err) {
      console.error("Failed to record click", err);
    }
  });

  return response;
}
