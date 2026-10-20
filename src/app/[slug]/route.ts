import { NextResponse, after, type NextRequest } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { clicks, links } from "@/db/schema";
import { SLUG_PATTERN } from "@/lib/links";
import { isBotRequest, parseClick } from "@/lib/tracking";

/**
 * Small in-memory cache of slug -> link so popular links don't hit MySQL on
 * every click. Entries live 60 seconds, so an edited or deleted link catches
 * up within a minute. Works because the app runs as one process on the VPS.
 */
type Cached = { id: number; url: string; expires: number } | { id: 0; url: ""; expires: number };
const cache = new Map<string, Cached>();
const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;

async function findLink(slug: string) {
  const now = Date.now();
  const hit = cache.get(slug);
  if (hit && hit.expires > now) return hit.id ? hit : null;

  const [row] = await db.select({ id: links.id, url: links.url }).from(links).where(eq(links.slug, slug)).limit(1);

  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value!);
  // Misses are cached too, so someone hammering random slugs can't flood the database.
  cache.set(slug, row ? { ...row, expires: now + TTL_MS } : { id: 0, url: "", expires: now + TTL_MS });
  return row ?? null;
}

export async function GET(request: NextRequest, ctx: RouteContext<"/[slug]">) {
  const { slug } = await ctx.params;
  const notFound = NextResponse.redirect(new URL("/link-not-found", request.url), 302);

  if (!SLUG_PATTERN.test(slug)) return notFound;

  const link = await findLink(slug);
  if (!link) return notFound;

  // Read everything we need from the request now, then log after the redirect is sent.
  const userAgent = request.headers.get("user-agent") ?? "";
  if (!isBotRequest(userAgent)) {
    const info = parseClick(request.headers);
    after(async () => {
      try {
        await db.insert(clicks).values({ linkId: link.id, ...info });
        await db
          .update(links)
          .set({ clickCount: sql`${links.clickCount} + 1` })
          .where(eq(links.id, link.id));
      } catch (err) {
        console.error("Failed to record click", err);
      }
    });
  }

  // 302, not 301: browsers cache 301s and would skip us on repeat visits, losing those clicks.
  const response = NextResponse.redirect(link.url, 302);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "unsafe-url");
  return response;
}
