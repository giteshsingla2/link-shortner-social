"use server";

import { and, count, eq, gte, sql } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { links } from "@/db/schema";
import { getSessionUserId } from "@/lib/session";
import { generateSlug, isUnsafeUrl, normalizeUrl, RESERVED_SLUGS, SLUG_PATTERN, shortUrl } from "@/lib/links";

export type CreateLinkState =
  | { ok: true; shortUrl: string; slug: string }
  | { ok: false; error: string; fields?: { url?: string; slug?: string; title?: string } }
  | undefined;

const APP_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_APP_URL ?? "").hostname;
  } catch {
    return "";
  }
})();

export async function createLink(_prev: CreateLinkState, formData: FormData): Promise<CreateLinkState> {
  // Server actions can be called directly, so check the session here too.
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const rawUrl = String(formData.get("url") ?? "");
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim().slice(0, 255) || null;
  const fields = { url: rawUrl, slug: rawSlug, title: title ?? "" };

  const url = normalizeUrl(rawUrl);
  if (!url) return { ok: false, error: "That doesn't look like a valid web address.", fields };

  if (APP_HOST && new URL(url).hostname === APP_HOST) {
    return { ok: false, error: "That's already one of our short links.", fields };
  }

  if (rawSlug) {
    if (!SLUG_PATTERN.test(rawSlug)) {
      return { ok: false, error: "Custom ending can use letters, numbers, - and _ (3 to 64 characters).", fields };
    }
    if (RESERVED_SLUGS.has(rawSlug.toLowerCase())) {
      return { ok: false, error: "That ending is reserved. Pick another one.", fields };
    }
  }

  // Simple spam brake: cap how many links one account can make per hour.
  const perHour = Number(process.env.LINKS_PER_HOUR) || 60;
  const [{ recent }] = await db
    .select({ recent: count() })
    .from(links)
    .where(and(eq(links.userId, userId), gte(links.createdAt, sql`NOW() - INTERVAL 1 HOUR`)));
  if (recent >= perHour) {
    return { ok: false, error: `You've made ${perHour} links in the last hour. Try again a bit later.`, fields };
  }

  if (await isUnsafeUrl(url)) {
    return { ok: false, error: "Google Safe Browsing flags this site as unsafe, so it can't be shortened.", fields };
  }

  // Custom ending: one try. Random ending: retry on the rare collision.
  const attempts = rawSlug ? 1 : 5;
  for (let i = 0; i < attempts; i++) {
    const slug = rawSlug || generateSlug();
    try {
      await db.insert(links).values({ userId, slug, url, title });
      refresh();
      return { ok: true, slug, shortUrl: shortUrl(slug) };
    } catch (err) {
      const duplicate = (err as { code?: string; cause?: { code?: string } }).cause?.code === "ER_DUP_ENTRY" ||
        (err as { code?: string }).code === "ER_DUP_ENTRY";
      if (!duplicate) throw err;
      if (rawSlug) return { ok: false, error: "That ending is taken. Pick another one.", fields };
    }
  }
  return { ok: false, error: "Couldn't create a unique link. Please try again.", fields };
}

export async function deleteLink(formData: FormData) {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return;

  // The userId condition stops anyone deleting a link that isn't theirs.
  await db.delete(links).where(and(eq(links.id, id), eq(links.userId, userId)));
  refresh();
  if (formData.get("redirectTo") === "dashboard") redirect("/dashboard");
}
