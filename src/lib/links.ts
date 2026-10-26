import "server-only";
import { customAlphabet } from "nanoid";

// No look-alike characters (0/O, 1/l/I) so links are easy to read out loud.
export const generateSlug = customAlphabet("23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ", 7);

// Paths the app itself uses. A short link can't take these names.
export const RESERVED_SLUGS = new Set([
  "dashboard", "login", "signup", "logout", "auth", "api", "admin", "settings",
  "link-not-found", "link-disabled", "_next", "favicon.ico", "robots.txt", "sitemap.xml", "about",
  "pricing", "terms", "privacy", "help", "support", "static", "public",
]);

export const SLUG_PATTERN = /^[a-zA-Z0-9_-]{3,64}$/;

/** Accepts "example.com/page" too, and returns a clean absolute http(s) URL or null. */
export function normalizeUrl(input: string): string | null {
  let value = input.trim();
  if (!value) return null;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(value)) value = `https://${value}`;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".") && url.hostname !== "localhost") return null;
    return url.toString().slice(0, 2048);
  } catch {
    return null;
  }
}

export function shortUrl(slug: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/${slug}`;
}

/**
 * Checks the URL against Google Safe Browsing when GOOGLE_SAFE_BROWSING_KEY is set.
 * Returns true when the URL is flagged as phishing, malware or unwanted software.
 * If the check itself fails (network, quota), the link is allowed rather than blocking users.
 */
export async function isUnsafeUrl(url: string): Promise<boolean> {
  const key = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!key) return false;
  try {
    const res = await fetch(`https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${key}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client: { clientId: "shortly", clientVersion: "1.0" },
        threatInfo: {
          threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
          platformTypes: ["ANY_PLATFORM"],
          threatEntryTypes: ["URL"],
          threatEntries: [{ url }],
        },
      }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { matches?: unknown[] };
    return Array.isArray(data.matches) && data.matches.length > 0;
  } catch {
    return false;
  }
}
