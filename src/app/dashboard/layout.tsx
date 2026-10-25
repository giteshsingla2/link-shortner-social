import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { TimeZoneCookie } from "@/components/time-zone-cookie";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions/auth";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <Logo href="/dashboard" />
          <Suspense fallback={<span className="h-8 w-24 animate-pulse rounded-lg bg-bg" />}>
            <UserMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <TimeZoneCookie />
    </div>
  );
}

async function UserMenu() {
  const user = await getCurrentUser();
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
      <form action={logout}>
        <button type="submit" className="btn-ghost">Log out</button>
      </form>
    </div>
  );
}
