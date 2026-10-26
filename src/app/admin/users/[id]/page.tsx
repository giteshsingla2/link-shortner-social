import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { deleteUser, setUserSuspended } from "@/app/actions/admin";
import { ActionButton } from "@/components/admin/action-button";
import { Badge } from "@/components/admin/controls";
import { SetPasswordForm } from "@/components/admin/set-password-form";
import { LinksTable } from "@/components/admin/tables";
import { BarList, STAT_GRID, StatCard } from "@/components/charts";
import { ClicksChart } from "@/components/clicks-chart";
import { CalendarIcon, CursorIcon, LinkIcon, SunIcon, TrashIcon } from "@/components/icons";
import { RangeTabs } from "@/components/range-tabs";
import { Toolbar } from "@/components/toolbar";
import { getLinksWithStats, getUserForAdmin } from "@/lib/admin-stats";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { countryLabel, formatChange, formatDate, formatNumber } from "@/lib/format";
import { getUserOverview, parseRange, rangeLabel } from "@/lib/stats";
import { getViewerZone } from "@/lib/timezone";

export const metadata: Metadata = { title: "User · Admin · Shortly" };

function visitors(n: number) {
  return `${formatNumber(n)} unique ${n === 1 ? "visitor" : "visitors"}`;
}

export default function AdminUserPage(props: PageProps<"/admin/users/[id]">) {
  return (
    <Suspense
      fallback={
        <>
          <Toolbar title="User" backHref="/admin/users" />
          <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
            <div className="card h-96 animate-pulse" />
          </div>
        </>
      }
    >
      <UserDetail {...props} />
    </Suspense>
  );
}

async function UserDetail({ params, searchParams }: PageProps<"/admin/users/[id]">) {
  await requireAdmin();
  const userId = Number((await params).id);
  if (!Number.isInteger(userId)) notFound();
  const range = parseRange((await searchParams).range);
  const zone = await getViewerZone();

  const user = await getUserForAdmin(userId);
  if (!user) notFound();
  const [o, userLinks] = await Promise.all([getUserOverview(userId, range, zone), getLinksWithStats({ zone, userId, sort: "today" })]);
  const yesterday = userLinks.reduce((sum, l) => sum + l.yesterday, 0);
  const isAdmin = isAdminEmail(user.email);
  const change = formatChange(o.todayClicks, yesterday);

  return (
    <>
      <Toolbar title={user.name} subtitle={user.email} backHref="/admin/users">
        <RangeTabs basePath={`/admin/users/${user.id}`} current={range} />
      </Toolbar>

      <div className="mx-auto w-full max-w-6xl space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        <section className="card space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full font-display text-xl font-semibold text-white uppercase"
              style={{ background: "linear-gradient(150deg, #6ab0ff, #2f6fe0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,.4)" }}
              aria-hidden
            >
              {user.name.charAt(0) || "?"}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-display text-xl font-semibold tracking-tight">{user.name}</h2>
                {isAdmin && <Badge tone="orange">Admin</Badge>}
                {user.suspendedAt ? <Badge tone="red">Suspended {formatDate(user.suspendedAt)}</Badge> : <Badge tone="green">Active</Badge>}
              </div>
              <p className="truncate text-sm text-muted">
                {user.email} · joined {formatDate(user.createdAt)}
              </p>
            </div>
          </div>

          {isAdmin ? (
            <p className="rounded-xl bg-hover px-3.5 py-2.5 text-sm text-muted">
              This is an admin account (listed in ADMIN_EMAILS), so it can&apos;t be suspended, deleted or have its password changed here.
            </p>
          ) : (
            <div className="flex flex-wrap items-start gap-2 border-t border-line pt-5">
              {user.suspendedAt ? (
                <ActionButton action={setUserSuspended} fields={{ id: user.id, suspend: "0" }} className="btn-ghost text-good">
                  Unsuspend
                </ActionButton>
              ) : (
                <ActionButton
                  action={setUserSuspended}
                  fields={{ id: user.id, suspend: "1" }}
                  confirm={`Suspend ${user.email}? They'll be signed out, can't log in, and all their links will stop working until you unsuspend them.`}
                  className="btn-ghost"
                >
                  Suspend
                </ActionButton>
              )}
              <ActionButton
                action={deleteUser}
                fields={{ id: user.id }}
                confirm={`Delete ${user.email} for good? Their account, ${userLinks.length} links and all their clicks will be removed. This can't be undone.`}
                className="btn-ghost text-danger"
              >
                <TrashIcon size={15} />
                Delete user
              </ActionButton>
              <div className="w-full sm:w-auto sm:flex-1">
                <SetPasswordForm userId={user.id} />
              </div>
            </div>
          )}
        </section>

        <div className={STAT_GRID}>
          <StatCard icon={<LinkIcon size={15} />} tint="purple" label="Links" value={formatNumber(o.totalLinks)} />
          <StatCard icon={<CursorIcon size={15} />} tint="orange" label="All-time clicks" value={formatNumber(o.totalClicks)} />
          <StatCard
            icon={<SunIcon size={15} />}
            tint="gold"
            label="Today"
            value={formatNumber(o.todayClicks)}
            hint={`${visitors(o.todayVisitors)}${change ? ` · ${change}` : ""}`}
          />
          <StatCard icon={<CalendarIcon size={15} />} tint="rose" label="Yesterday" value={formatNumber(yesterday)} />
          {range !== 1 && <StatCard icon={<CalendarIcon size={15} />} tint="blue" label={rangeLabel(range)} value={formatNumber(o.rangeClicks)} hint={visitors(o.rangeVisitors)} />}
        </div>

        <ClicksChart data={o.series} unit={range === 1 ? "hour" : "day"} />

        <div className="grid gap-3 md:grid-cols-2">
          <BarList title="Top countries" data={o.countries} formatLabel={countryLabel} />
          <BarList title="Top platforms" data={o.platforms} />
        </div>

        <section className="space-y-3">
          <h2 className="px-1 font-display text-[19px] font-semibold tracking-tight">
            Links <span className="text-[15px] font-normal text-muted tabular-nums">{userLinks.length}</span>
          </h2>
          <LinksTable rows={userLinks} back={`/admin/users/${user.id}`} showOwner={false} empty="This user hasn't made any links yet." />
        </section>
      </div>
    </>
  );
}
