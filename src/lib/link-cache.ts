import "server-only";

/**
 * Small in-memory cache of slug -> link so popular links don't hit MySQL on
 * every click. Entries live 60 seconds; editing, deleting or disabling a link
 * clears its entry right away (forgetLink). Works because the app runs as one process.
 *
 * Kept on globalThis so the redirect route and the server actions share one
 * Map even if Next loads this module once per bundle. Keys are lower-cased
 * because slug lookups in MySQL ignore case.
 */
// `disabled`: an admin disabled the link or suspended its owner, so it shows /link-disabled.
export type CachedLink = { id: number; url: string; disabled: boolean; expires: number } | { id: 0; url: ""; disabled: false; expires: number };

const g = globalThis as unknown as { linkCache?: Map<string, CachedLink> };
export const linkCache = (g.linkCache ??= new Map<string, CachedLink>());

export function cacheKey(slug: string) {
  return slug.toLowerCase();
}

export function forgetLink(slug: string) {
  linkCache.delete(cacheKey(slug));
}

/** After suspending or deleting a user, every one of their links changes at once. */
export function clearLinkCache() {
  linkCache.clear();
}
