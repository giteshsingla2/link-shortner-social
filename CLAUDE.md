@AGENTS.md

# Shortly: project notes for Claude Code

Link shortener with per-click analytics. Next.js 16 App Router + MySQL (Drizzle ORM) + Tailwind v4. Deployed as a single Node process (PM2) on a CloudPanel VPS behind Cloudflare.

## Commands

- `npm run dev` - dev server on :3000 (needs `.env`, see `.env.example`)
- `npm run typecheck` - route types + `tsc`
- `npm run lint`
- `npm run build`
- `npm run db:generate` / `npm run db:migrate` - after editing `src/db/schema.ts`. Keep `database/schema.sql` (the phpMyAdmin import file) in sync by hand.

## Next.js 16 specifics this codebase relies on

- `cacheComponents` is on. Anything reading cookies, headers, params, searchParams or the database must render inside `<Suspense>`, or the build fails. Pages follow the pattern: static shell in the page component, data in an async child inside Suspense.
- Middleware is `src/proxy.ts` (renamed in v16). It verifies the session JWT signature only; `getCurrentUser()` in `src/lib/auth.ts` does the real check.
- Server actions call `refresh()` from `next/cache` after mutations (data isn't cached, so no tags).
- `after()` from `next/server` logs clicks once the redirect has been sent.
- Read `node_modules/next/dist/docs/` before using an unfamiliar API; this Next version differs from older training data.

## Rules

- Every server action re-checks the session with `getSessionUserId()`. Every query on links filters by `userId` so users can only see or change their own links.
- Redirects are 302, never 301 (301s get cached and clicks are lost).
- Don't store visitor IP addresses.
- Paths used by the app must be in `RESERVED_SLUGS` (`src/lib/links.ts`), because `src/app/[slug]/route.ts` catches every single-segment path not claimed by a page.
- `ua-parser-js` is pinned to v1 on purpose: v2 is AGPL, which would require publishing the source of the hosted app.
- Times are stored in UTC (`timezone: "Z"` on the pool; queries use `UTC_TIMESTAMP()`).
