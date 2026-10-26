import "server-only";

/**
 * Small in-memory cache of slug -> link so popular links don't hit MySQL on
 * every click. Entries live 60 seconds; editing or deleting a link clears its
 * entry right away (forgetLink). Works because the app runs as one process.
 *
 * Kept on globalThis so the redirect route and the server actions share one
 * Map even if Next loads this module once per bundle. Keys are lower-cased
 * because slug lookups in MySQL ignore case.
 */
export type CachedLink = { id: number; url: string; expires: number } | { id: 0; url: ""; expires: number };

const g = globalThis as unknown as { linkCache?: Map<string, CachedLink> };
export const linkCache = (g.linkCache ??= new Map<string, CachedLink>());

export function cacheKey(slug: string) {
  return slug.toLowerCase();
}

export function forgetLink(slug: string) {
  linkCache.delete(cacheKey(slug));
}
