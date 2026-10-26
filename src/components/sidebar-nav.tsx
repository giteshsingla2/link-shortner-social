"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { AppsIcon, LogoutIcon, PlusIcon, ShieldIcon } from "./icons";
import { LinkAvatar } from "./link-avatar";
import { Logo } from "./logo";

export type SidebarLink = { id: number; slug: string; url: string; title: string | null; todayClicks: number; disabled: boolean };

/**
 * The edge-to-edge glass sidebar, like Finder or Mail: app sections at the
 * top, every link below it, and the signed-in person at the bottom.
 */
export function SidebarNav({ user, links, isAdmin }: { user: { name: string; email: string }; links: SidebarLink[]; isAdmin: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Logo href="/dashboard" />
      </div>

      <nav className="space-y-0.5 px-3" aria-label="Main">
        <SidebarItem href="/dashboard" active={pathname === "/dashboard"} icon={<AppsIcon size={17} />}>
          Overview
        </SidebarItem>
        <SidebarItem href="/dashboard#new" active={false} icon={<PlusIcon size={17} />}>
          New link
        </SidebarItem>
        {isAdmin && (
          <SidebarItem href="/admin" active={false} icon={<ShieldIcon size={17} />}>
            Admin panel
          </SidebarItem>
        )}
      </nav>

      <div className="mt-6 flex items-baseline justify-between px-5 pb-1.5">
        <span className="eyebrow">Links</span>
        <span className="text-[11px] text-muted tabular-nums">{links.length}</span>
      </div>
      <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 pb-3" aria-label="Your links">
        {links.length === 0 && <p className="px-2 py-1 text-[13px] text-muted">Your links will show up here.</p>}
        {links.map((l) => {
          const href = `/dashboard/links/${l.id}`;
          return (
            <SidebarItem key={l.id} href={href} active={pathname === href} icon={<LinkAvatar url={l.url} size={22} />}>
              <span className={`min-w-0 flex-1 truncate ${l.disabled ? "text-muted line-through" : ""}`}>{l.title || `/${l.slug}`}</span>
              {l.todayClicks > 0 && (
                <span className="rounded-full bg-accent-soft px-1.5 text-[11px] font-semibold text-link tabular-nums" title="Clicks today">
                  {l.todayClicks}
                </span>
              )}
            </SidebarItem>
          );
        })}
      </nav>

      <div className="flex items-center gap-2.5 border-t border-line px-4 py-3">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white uppercase"
          style={{ background: "linear-gradient(150deg, #6ab0ff, #2f6fe0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}
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

function SidebarItem({
  href,
  active,
  icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-2.5 rounded-[10px] px-2 py-1.5 text-[13.5px] transition ${
        active ? "font-medium text-ink" : "text-ink/85 hover:bg-hover"
      }`}
      style={active ? { background: "var(--glass-strong)", boxShadow: "inset 0 1px 0 var(--glass-shine), 0 1px 3px rgba(0,0,0,.08)" } : undefined}
    >
      <span className={`grid shrink-0 place-items-center ${active ? "text-link" : "text-muted"}`}>{icon}</span>
      {children}
    </Link>
  );
}
