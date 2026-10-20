import Link from "next/link";
import { Logo } from "@/components/logo";

const FEATURES = [
  { title: "Clicks over time", body: "See every day's clicks for each link, over the last 7, 30 or 90 days." },
  { title: "Where people are", body: "Clicks by country, so you know which markets your link reaches." },
  { title: "Which app sent them", body: "Instagram, Facebook, YouTube, TikTok, Google and more, detected per click." },
  { title: "Device, OS and browser", body: "Mobile or desktop, Android or iOS, Chrome or Safari." },
  { title: "Custom endings", body: "Turn a random code into something people remember, like /summer-sale." },
  { title: "Bots filtered out", body: "WhatsApp and Telegram preview fetchers don't inflate your numbers." },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5 sm:px-6">
        <Logo />
        <nav className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost border-transparent bg-transparent">Log in</Link>
          <Link href="/signup" className="btn py-2 text-sm">Sign up free</Link>
        </nav>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:pt-24">
          <p className="mb-4 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-medium text-accent">
            Free link shortener with click stats
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
            Short links that tell you who clicked
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted text-pretty">
            Paste a long URL, get a short one, and watch the clicks come in by country, app, device and browser.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="btn px-6 py-3">Create a free account</Link>
            <Link href="/login" className="btn-ghost px-6 py-3 text-[15px]">I already have one</Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-24">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="card p-5">
                <h2 className="font-semibold">{f.title}</h2>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-line py-6 text-center text-sm text-muted">
        Shortly · Built with Next.js and MySQL
      </footer>
    </div>
  );
}
