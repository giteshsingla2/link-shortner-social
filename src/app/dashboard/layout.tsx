import Link from "next/link";
import { Suspense } from "react";
import { logout } from "@/app/actions/auth";
import { LogoutIcon, ShieldIcon } from "@/components/icons";
import { Logo } from "@/components/logo";
import { SidebarNav } from "@/components/sidebar-nav";
import { TimeZoneCookie } from "@/components/time-zone-cookie";
import { getCurrentUser } from "@/lib/auth";
import { getUserLinks } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";

/**
 * A Mac-style window: an edge-to-edge glass sidebar on wide screens, and on
 * phones a slim bar with the logo and log out (the links list is on the page).
 */
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="bar sticky top-0 hidden h-screen w-[264px] shrink-0 border-r border-line lg:block">
        <Suspense fallback={<SidebarSkeleton />}>
          <Sidebar />
        </Suspense>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-1 sm:px-6 lg:hidden">
          <Logo href="/dashboard" />
          <div className="flex gap-2">
            <Suspense fallback={null}>
              <AdminLink />
            </Suspense>
            <form action={logout}>
              <button type="submit" className="btn-ghost">
                <LogoutIcon size={16} />
                Log out
              </button>
            </form>
          </div>
        </div>
        {children}
      </div>
      <TimeZoneCookie />
    </div>
  );
}

async function Sidebar() {
  const user = await getCurrentUser();
  const links = await getUserLinks(user.id, await getViewerZone());
  return (
    <SidebarNav
      user={{ name: user.name, email: user.email }}
      isAdmin={user.isAdmin}
      links={links.map((l) => ({ id: l.id, slug: l.slug, url: l.url, title: l.title, todayClicks: l.todayClicks, disabled: Boolean(l.disabledAt) }))}
    />
  );
}

/** Phones only: a way into the admin panel for admins. */
async function AdminLink() {
  const user = await getCurrentUser();
  if (!user.isAdmin) return null;
  return (
    <Link href="/admin" className="btn-ghost">
      <ShieldIcon size={16} />
      Admin
    </Link>
  );
}

function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-5">
      <div className="h-7 w-28 animate-pulse rounded-lg bg-hover" />
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="h-7 animate-pulse rounded-lg bg-hover" />
      ))}
    </div>
  );
}
