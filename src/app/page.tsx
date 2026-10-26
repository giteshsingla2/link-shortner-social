import Link from "next/link";
import { TintTile, type Tint } from "@/components/charts";
import { AppsIcon, ArrowUpRightIcon, ChartIcon, DeviceIcon, GlobeIcon, PencilIcon, PeopleIcon, ShieldIcon, SparkleIcon } from "@/components/icons";
import { AppIcon, Logo } from "@/components/logo";

const FEATURES: { title: string; body: string; icon: React.ReactNode; tint: Tint }[] = [
  { title: "Clicks over time", body: "Hour by hour for today, day by day for the last 7, 30 or 90 days.", icon: <ChartIcon size={17} />, tint: "orange" },
  { title: "Where people are", body: "Clicks by country, so you know which markets your link reaches.", icon: <GlobeIcon size={17} />, tint: "green" },
  { title: "Which app sent them", body: "Instagram, YouTube, TikTok, Google and more, detected on every click.", icon: <AppsIcon size={17} />, tint: "purple" },
  { title: "Unique visitors", body: "See how many people clicked, not just how many times.", icon: <PeopleIcon size={17} />, tint: "blue" },
  { title: "Device, OS and browser", body: "Mobile or desktop, Android or iOS, Chrome or Safari.", icon: <DeviceIcon size={17} />, tint: "gold" },
  { title: "Edit any time", body: "Change where a link goes without reprinting it. Its stats stay.", icon: <PencilIcon size={17} />, tint: "rose" },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Floating glass menu bar. */}
      <div className="sticky top-0 z-40 px-3 pt-3 sm:px-6 sm:pt-4">
        <header className="glass mx-auto flex max-w-5xl items-center justify-between rounded-full py-2 pr-2 pl-4">
          <Logo />
          <nav className="flex items-center gap-1.5">
            <Link href="/login" className="rounded-full px-3.5 py-2 text-sm font-medium text-ink/80 transition hover:bg-hover hover:text-ink">
              Log in
            </Link>
            <Link href="/signup" className="btn py-2 text-sm">
              Sign up free
            </Link>
          </nav>
        </header>
      </div>

      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 pt-16 pb-14 text-center sm:pt-24">
          <p className="glass mx-auto inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium">
            <SparkleIcon size={14} className="text-link" />
            Free link shortener with real click stats
          </p>
          <h1 className="mt-6 font-display text-[44px] leading-[1.02] font-bold tracking-[-0.035em] text-balance sm:text-[76px]">
            Short links that tell you{" "}
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: "linear-gradient(100deg, var(--headline-gold) 0%, var(--accent) 55%, #e0405f 100%)" }}
            >
              who clicked.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted text-pretty sm:text-xl">
            Paste a long URL, share the short one, and watch clicks arrive by country, app, device and browser.
          </p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn px-7 py-3.5 text-base">
              Create a free account
            </Link>
            <Link href="/login" className="btn-ghost px-7 py-3.5 text-base">
              I already have one
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20">
          <ProductPreview />
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <h2 className="text-center font-display text-3xl font-semibold tracking-tight sm:text-4xl">Everything a link can tell you</h2>
          <p className="mx-auto mt-3 max-w-lg text-center text-muted">Bots and link previews from WhatsApp, Telegram and Slack are filtered out, so the numbers are real people.</p>
          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <TintTile tint={f.tint} size={36}>
                  {f.icon}
                </TintTile>
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 pb-24">
          <div className="card flex flex-col items-center gap-5 px-6 py-12 text-center">
            <AppIcon size={56} />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-balance">Your next link could tell you a lot.</h2>
            <Link href="/signup" className="btn px-7 py-3.5 text-base">
              Get started, it&apos;s free
              <ArrowUpRightIcon size={16} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="flex items-center justify-center gap-2 pb-8 text-[13px] text-muted">
        <ShieldIcon size={14} />
        No visitor IP addresses are stored.
      </footer>
    </div>
  );
}

const PREVIEW_BARS = [18, 26, 22, 35, 30, 44, 38, 52, 47, 61, 55, 72, 66, 88];
const PREVIEW_LINKS = [
  { name: "Instagram bio", color: ["#ff8fa3", "#e64a6e"], today: 128 },
  { name: "/summer-sale", color: ["#ffb340", "#f0562b"], today: 64 },
  { name: "YouTube launch", color: ["#6ab0ff", "#2f6fe0"], today: 31 },
  { name: "/menu", color: ["#5fdc8c", "#1f9d55"], today: 9 },
];

/** A drawn (not screenshotted) dashboard inside a frosted macOS window. */
function ProductPreview() {
  return (
    <figure className="card overflow-hidden rounded-[26px] p-0" aria-label="Preview of the Shortly dashboard">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3" aria-hidden>
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="mx-auto pr-12 text-[13px] font-medium text-muted">Shortly — Overview</span>
      </div>
      <div className="flex" aria-hidden>
        <div className="hidden w-52 shrink-0 space-y-1 border-r border-line p-3 md:block">
          <p className="eyebrow px-2 pb-1">Links</p>
          {PREVIEW_LINKS.map((l, i) => (
            <div key={l.name} className="flex items-center gap-2 rounded-[10px] px-2 py-1.5 text-[13px]" style={i === 0 ? { background: "var(--glass-strong)" } : undefined}>
              <span className="h-[18px] w-[18px] rounded-[6px]" style={{ background: `linear-gradient(150deg, ${l.color[0]}, ${l.color[1]})` }} />
              <span className="flex-1 truncate">{l.name}</span>
              <span className="rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-link">{l.today}</span>
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2.5">
            {[
              ["Today", "232", "gold"],
              ["Last 7 days", "1,846", "rose"],
              ["Visitors", "1,203", "blue"],
            ].map(([label, value, tint]) => (
              <div key={label} className="rounded-2xl border border-line p-3" style={{ background: "var(--glass-strong)" }}>
                <div className="flex items-center gap-1.5">
                  <TintTile tint={tint as Tint} size={18}>
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </TintTile>
                  <span className="truncate text-[11px] text-muted">{label}</span>
                </div>
                <p className="mt-2 font-display text-lg font-semibold tabular-nums sm:text-2xl">{value}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-line p-3 sm:p-4" style={{ background: "var(--glass-strong)" }}>
            <p className="text-[11px] font-semibold">Clicks per day</p>
            <div className="mt-3 flex h-28 items-end gap-1.5 sm:h-40 sm:gap-2.5">
              {PREVIEW_BARS.map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-t-[5px] rounded-b-[2px]"
                  style={{ height: `${h}%`, background: "linear-gradient(180deg, var(--accent-2), var(--accent))", opacity: i === PREVIEW_BARS.length - 1 ? 1 : 0.85 }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-[12px]">
            {[
              ["🇮🇳  India", 62],
              ["Instagram", 48],
            ].map(([label, pct]) => (
              <div key={label} className="relative overflow-hidden rounded-[10px] border border-line px-2.5 py-2" style={{ background: "var(--glass-strong)" }}>
                <span className="absolute inset-y-0 left-0 bg-accent-soft" style={{ width: `${pct}%` }} />
                <span className="relative flex justify-between">
                  <span>{label}</span>
                  <span className="font-semibold">{pct}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </figure>
  );
}
