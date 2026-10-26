import { Suspense } from "react";
import { AdminSidebar, AdminTabs } from "@/components/admin/admin-nav";
import { TimeZoneCookie } from "@/components/time-zone-cookie";
import { requireAdmin } from "@/lib/auth";

/**
 * The admin panel's window. Nothing renders until the visitor is confirmed as
 * an admin (anyone else gets the site's 404), and every page and action checks
 * again on its own.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-screen">
      <aside className="bar sticky top-0 hidden h-screen w-[248px] shrink-0 border-r border-line lg:block">
        <AdminSidebar user={{ name: admin.name, email: admin.email }} />
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTabs />
        {children}
      </div>
      <TimeZoneCookie />
    </div>
  );
}
