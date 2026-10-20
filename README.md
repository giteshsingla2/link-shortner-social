# Shortly: link shortener with click analytics

People sign up, shorten links, and see clicks per link by day, country, platform (Instagram, Facebook, YouTube, Google...), device, OS, browser and referring site.

Stack: Next.js 16 (App Router), MySQL, Drizzle ORM, Tailwind CSS. No paid services. It all runs on one VPS.

## Run it on your laptop

1. Install Node.js 20 or newer and have a MySQL (or MariaDB) server running.
2. Create a database and import the tables:
   - phpMyAdmin: create a database (e.g. `link_shortener`), open it, Import tab, choose `database/schema.sql`
   - or command line: `mysql -u root -p link_shortener < database/schema.sql`
3. Copy the env file and fill it in:
   ```bash
   cp .env.example .env
   ```
   Generate `SESSION_SECRET` with:
   ```bash
   node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
   ```
4. Install and start:
   ```bash
   npm install
   npm run dev
   ```
5. Open http://localhost:3000, sign up, and shorten a link.

On localhost there's no Cloudflare in front, so country shows as "Unknown". Everything else is tracked.

## Deploy on a CloudPanel VPS

Needs about 1 GB of free RAM while it runs, and 1.5 to 2 GB during `npm run build`. If the server is small, add swap or build on your laptop (see "Low RAM" below).

### 1. Database

CloudPanel > Databases > Add Database. Note the database name, user and password. Open phpMyAdmin from there and import `database/schema.sql`.

### 2. Site

CloudPanel > Sites > Add Site > **Create a Node.js Site**.
- Domain: your short domain (e.g. `go.yourbrand.com`)
- Node.js version: 22 (or 20)
- App port: 3000 (any free port works; use the same one in step 4)

Then get an SSL certificate: Sites > your site > SSL/TLS > New Let's Encrypt Certificate.

### 3. Code and settings

SSH in as the site user (CloudPanel shows the user and path, usually `/home/<site-user>/htdocs/<domain>`):

```bash
cd ~/htdocs/go.yourbrand.com
git clone <your-repo-url> .      # or upload the project files with SFTP
cp .env.example .env
nano .env                        # fill in DATABASE_URL, SESSION_SECRET, NEXT_PUBLIC_APP_URL=https://go.yourbrand.com
npm ci
npm run build
```

`NEXT_PUBLIC_APP_URL` is baked in at build time. If you change it, run `npm run build` again.

### 4. Keep it running with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.cjs   # uses port 3000; edit the file to change it
pm2 save
pm2 startup     # prints one command; run it so the app restarts after a reboot
```

CloudPanel's Nginx already forwards your domain to port 3000.

### 5. Cloudflare (for country stats)

Add your domain to Cloudflare's free plan and turn the orange cloud (proxy) on for the short-link domain. Cloudflare then sends a `cf-ipcountry` header with every visit, and the app reads it. Set SSL mode to **Full (strict)** since the server has a Let's Encrypt certificate.

### Updating later

```bash
git pull
npm ci
npm run build
pm2 restart shortly
```

### Low RAM: build on your laptop instead

Run `npm run build` locally with the production `.env`, then upload the project including the `.next` folder (skip `node_modules` and run `npm ci` on the server). Start with PM2 as above.

## How it works

| Part | File |
|---|---|
| Redirect + click logging | `src/app/[slug]/route.ts` |
| Country, platform, device, OS, browser, bot detection | `src/lib/tracking.ts` |
| Login / signup / logout | `src/app/actions/auth.ts`, `src/lib/session.ts` |
| Create / delete links, spam limits | `src/app/actions/links.ts`, `src/lib/links.ts` |
| Stats queries | `src/lib/stats.ts` |
| Folding old clicks into daily counts | `src/lib/rollup.ts`, started from `src/instrumentation.ts` |
| Database tables | `src/db/schema.ts` (same as `database/schema.sql`) |
| Dashboard pages | `src/app/dashboard/` |

A few decisions worth knowing:

- **302 redirects, not 301.** Browsers cache 301s and skip the server on repeat visits, which would lose those clicks.
- **Click logging runs after the redirect is sent** (Next.js `after()`), so visitors never wait for the database.
- **Single clicks are kept for 7 days.** Every hour the app folds older days into the `click_daily` table: one row per link, day and combination of country, platform, device, OS, browser and referring site, with how many clicks had exactly that combination. Then it deletes those single rows. Nothing but the time of day is lost ("India + Instagram + Mobile" can still be counted), the 90-day charts read both tables, and busy links shrink from thousands of rows a day to a few hundred.
- **Repeat clicks are capped.** One person (one browser) counts at most `CLICKS_PER_VISITOR` times (default 3) per link every 24 hours. It's tracked with a cookie scoped to that short link, not by IP, so a different browser, an in-app browser or a private window counts again.
- **Bots don't count.** Search crawlers and link-preview fetchers (WhatsApp, Telegram, Slack, Facebook...) are filtered with `isbot` plus an extra list.
- **No IP addresses are stored.** Only country, platform, device, OS, browser and referring domain.
- **Short-link lookups are cached in memory for 60 seconds.** A deleted link can keep redirecting for up to a minute. This assumes one app process (the PM2 setup above).
- **WhatsApp and Telegram often show as "Direct".** Those apps usually open links in the phone's normal browser without a referrer. Every shortener has this gap. The fix is separate links per channel.

## Spam protection

- Users can create `LINKS_PER_HOUR` links per hour (default 60).
- Set `GOOGLE_SAFE_BROWSING_KEY` to reject known phishing and malware URLs. It's free: Google Cloud Console > enable "Safe Browsing API" > create an API key.
- Short links can't point to your own short domain (prevents redirect loops).

## Changing the database

Edit `src/db/schema.ts`, then:

```bash
npm run db:generate   # writes a new SQL file into drizzle/
npm run db:migrate    # applies it to the database in DATABASE_URL
```

Every table in `database/schema.sql` uses `CREATE TABLE IF NOT EXISTS`, so importing it again into an existing database only adds tables that are missing. That's the simplest way to pick up a new table after `git pull`.

If you set the database up from `database/schema.sql`, the first migration (`drizzle/0000_init.sql`) is already applied. Use `db:migrate` only for new migrations, or apply new SQL files by hand in phpMyAdmin.

## Ideas for later

QR codes per link, link expiry dates, password-protected links, editing a link's destination, unique visitors, CSV export, custom domains per user, a public API for the Android app, Google sign-in.
