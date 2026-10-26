"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { AppsIcon, ChartIcon, ChevronLeftIcon, CursorIcon, LinkIcon, LogoutIcon, PeopleIcon } from "../icons";
import { Logo } from "../logo";

const SECTIONS = [
  { href: "/admin", label: "Overview", icon: <AppsIcon size={17} /> },
  { href: "/admin/users", label: "Users", icon: <PeopleIcon size={17} /> },
  { href: "/admin/links", label: "Links", icon: <LinkIcon size={17} /> },
  { href: "/admin/clicks", label: "Clicks", icon: <CursorIcon size={17} /> },
];

function isActive(pathname: string, href: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

/** The admin panel's glass sidebar (wide screens). */
export function AdminSidebar({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 pt-5 pb-4">
        <Logo href="/admin" />
        <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-link">Admin</span>
      </div>

      <nav className="space-y-0.5 px-3" aria-label="Admin">
        {SECTIONS.map((s) => {
          const active = isActive(pathname, s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-[13.5px] transition ${active ? "font-medium" : "text-ink/85 hover:bg-hover"}`}
              style={active ? { background: "var(--glass-strong)", boxShadow: "inset 0 1px 0 var(--glass-shine), 0 1px 3px rgba(0,0,0,.08)" } : undefined}
            >
              <span className={active ? "text-link" : "text-muted"}>{s.icon}</span>
              {s.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-6 px-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-[13.5px] text-ink/85 transition hover:bg-hover">
          <span className="text-muted">
            <ChartIcon size={17} />
          </span>
          My dashboard
        </Link>
      </div>

      <div className="mt-auto flex items-center gap-2.5 border-t border-line px-4 py-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white uppercase"
          style={{ background: "linear-gradient(150deg, #ffb340, #f0562b)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}
          aria-hidden
        >
          {user.name.charAt(0) || "?"}
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[13px] font-medium">{user.name}</p>
          <p className="truncate text-[11px] text-muted">{user.email}</p>
        </div>
        <form action={logout}>
          <button type="submit" className="grid h-8 w-8 place-items-center rounded-full text-muted transition hover:bg-hover hover:text-ink" title="Log out" aria-label="Log out">
            <LogoutIcon size={17} />
          </button>
        </form>
      </div>
    </div>
  );
}

/** On phones: the same sections as scrollable pills under the logo. */
export function AdminTabs() {
  const pathname = usePathname();
  return (
    <div className="px-4 pt-4 sm:px-6 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo href="/admin" />
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-link">Admin</span>
        </div>
        <Link href="/dashboard" className="btn-ghost">
          <ChevronLeftIcon size={15} />
          My dashboard
        </Link>
      </div>
      <nav className="-mx-4 mt-3 flex gap-1.5 overflow-x-auto px-4 pb-1" aria-label="Admin">
        {SECTIONS.map((s) => {
          const active = isActive(pathname, s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              aria-current={active ? "page" : undefined}
              className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition ${
                active ? "border-transparent text-white" : "border-line text-ink/80 hover:bg-hover"
              }`}
              style={active ? { background: "linear-gradient(180deg, var(--accent-2) -40%, var(--accent) 70%)" } : { background: "var(--glass)" }}
            >
              {s.icon}
              {s.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
