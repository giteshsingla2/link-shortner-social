import Link from "next/link";
import { adminDeleteLink, setLinkDisabled } from "@/app/actions/admin";
import { isAdminEmail } from "@/lib/auth";
import { countryLabel, formatChange, formatDate, formatDateTime, formatNumber, prettyUrl } from "@/lib/format";
import { shortUrl } from "@/lib/links";
import { ChevronRightIcon, TrashIcon } from "../icons";
import { LinkAvatar } from "../link-avatar";
import { ActionButton } from "./action-button";
import { Badge, TodayVsYesterday } from "./controls";

const TH = "px-3 py-2.5 text-left text-[11px] font-semibold tracking-[0.05em] text-muted uppercase whitespace-nowrap";
const TD = "px-3 py-3 align-middle";

type UserRow = {
  id: number;
  name: string;
  email: string;
  createdAt: Date;
  suspendedAt: Date | null;
  links: number;
  clicks: number;
  today: number;
  yesterday: number;
};

export function UsersTable({ rows, empty = "No users found." }: { rows: UserRow[]; empty?: string }) {
  if (rows.length === 0) return <p className="card px-6 py-10 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="card overflow-x-auto p-1.5">
      <table className="w-full min-w-[720px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className={TH}>User</th>
            <th className={`${TH} text-right`}>Links</th>
            <th className={`${TH} text-right`}>All-time clicks</th>
            <th className={`${TH} text-right`}>Today</th>
            <th className={`${TH} text-right`}>Yesterday</th>
            <th className={TH}>Joined</th>
            <th className={TH}>
              <span className="sr-only">Open</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((u) => (
            <tr key={u.id} className="transition hover:bg-hover">
              <td className={TD}>
                <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                  <span
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-[13px] font-semibold text-white uppercase"
                    style={{ background: "linear-gradient(150deg, #6ab0ff, #2f6fe0)" }}
                    aria-hidden
                  >
                    {u.name.charAt(0) || "?"}
                  </span>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="truncate font-medium">{u.name}</span>
                      {isAdminEmail(u.email) && <Badge tone="orange">Admin</Badge>}
                      {u.suspendedAt && <Badge tone="red">Suspended</Badge>}
                    </span>
                    <span className="block truncate text-[13px] text-muted">{u.email}</span>
                  </span>
                </Link>
              </td>
              <td className={`${TD} text-right tabular-nums`}>{formatNumber(u.links)}</td>
              <td className={`${TD} text-right tabular-nums`}>{formatNumber(u.clicks)}</td>
              <td className={`${TD} text-right`}>
                <TodayVsYesterday today={u.today} yesterday={u.yesterday} change={formatChange(u.today, u.yesterday)} />
              </td>
              <td className={`${TD} text-right tabular-nums`}>{formatNumber(u.yesterday)}</td>
              <td className={`${TD} whitespace-nowrap text-muted`}>{formatDate(u.createdAt)}</td>
              <td className={`${TD} w-12`}>
                <Link href={`/admin/users/${u.id}`} className="btn-ghost h-8 w-8 px-0" aria-label={`Open ${u.email}`}>
                  <ChevronRightIcon size={15} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type LinkRow = {
  id: number;
  slug: string;
  url: string;
  title: string | null;
  clickCount: number;
  createdAt: Date;
  disabledAt: Date | null;
  ownerId: number;
  ownerEmail: string;
  ownerSuspendedAt: Date | null;
  today: number;
  yesterday: number;
};

/** All links with their owner and admin actions. `back` is where a delete returns to. */
export function LinksTable({ rows, back, showOwner = true, empty = "No links found." }: { rows: LinkRow[]; back: string; showOwner?: boolean; empty?: string }) {
  if (rows.length === 0) return <p className="card px-6 py-10 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="card overflow-x-auto p-1.5">
      <table className="w-full min-w-[860px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className={TH}>Link</th>
            {showOwner && <th className={TH}>Owner</th>}
            <th className={`${TH} text-right`}>Clicks</th>
            <th className={`${TH} text-right`}>Today</th>
            <th className={`${TH} text-right`}>Yesterday</th>
            <th className={TH}>Created</th>
            <th className={`${TH} text-right`}>Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((l) => {
            const short = prettyUrl(shortUrl(l.slug));
            return (
              <tr key={l.id} className="transition hover:bg-hover">
                <td className={`${TD} max-w-[320px]`}>
                  <Link href={`/admin/links/${l.id}`} className="flex items-center gap-3">
                    <LinkAvatar url={l.url} size={34} />
                    <span className="min-w-0">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate font-medium">{l.title || short}</span>
                        {l.disabledAt && <Badge tone="red">Disabled</Badge>}
                        {!l.disabledAt && l.ownerSuspendedAt && <Badge tone="gray">Owner suspended</Badge>}
                      </span>
                      <span className="block truncate text-[13px] text-muted">
                        <span className="font-mono text-link">{short}</span> → {prettyUrl(l.url)}
                      </span>
                    </span>
                  </Link>
                </td>
                {showOwner && (
                  <td className={`${TD} max-w-[200px]`}>
                    <Link href={`/admin/users/${l.ownerId}`} className="block truncate text-[13px] hover:underline">
                      {l.ownerEmail}
                    </Link>
                  </td>
                )}
                <td className={`${TD} text-right tabular-nums`}>{formatNumber(l.clickCount)}</td>
                <td className={`${TD} text-right`}>
                  <TodayVsYesterday today={l.today} yesterday={l.yesterday} change={formatChange(l.today, l.yesterday)} />
                </td>
                <td className={`${TD} text-right tabular-nums`}>{formatNumber(l.yesterday)}</td>
                <td className={`${TD} whitespace-nowrap text-muted`}>{formatDate(l.createdAt)}</td>
                <td className={TD}>
                  <div className="flex justify-end gap-1.5">
                    <LinkStateButton id={l.id} disabled={Boolean(l.disabledAt)} label={short} />
                    <ActionButton
                      action={adminDeleteLink}
                      fields={{ id: l.id, redirectTo: back }}
                      confirm={`Delete ${short}? It stops working and its clicks and stats are removed. This can't be undone.`}
                      className="btn-ghost h-8 w-8 px-0 text-danger"
                      title="Delete link"
                    >
                      <TrashIcon size={15} />
                      <span className="sr-only">Delete {short}</span>
                    </ActionButton>
                    <Link href={`/admin/links/${l.id}`} className="btn-ghost h-8 w-8 px-0" aria-label={`Stats for ${short}`} title="Stats">
                      <ChevronRightIcon size={15} />
                    </Link>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Disable a link (it shows "link disabled" instead of redirecting) or turn it back on. `compact` sizes it for table rows. */
export function LinkStateButton({ id, disabled, label, compact = true }: { id: number; disabled: boolean; label: string; compact?: boolean }) {
  const size = compact ? "py-1.5 text-[13px]" : "";
  return disabled ? (
    <ActionButton action={setLinkDisabled} fields={{ id, disable: "0" }} className={`btn-ghost text-good ${size}`}>
      Enable
    </ActionButton>
  ) : (
    <ActionButton
      action={setLinkDisabled}
      fields={{ id, disable: "1" }}
      confirm={`Disable ${label}? Visitors will see a "link disabled" page until you enable it again.`}
      className={`btn-ghost ${size}`}
    >
      Disable
    </ActionButton>
  );
}

type ClickRow = {
  id: number;
  clickedAt: Date;
  country: string | null;
  platform: string;
  device: string;
  os: string;
  browser: string;
  referrerHost: string | null;
  linkId: number;
  slug: string;
  title: string | null;
  ownerId: number;
  ownerEmail: string;
};

/** The click log: one row per counted click, times in the admin's time zone. */
export function ClicksTable({ rows, timeZone, showLink = true, empty = "No clicks yet." }: { rows: ClickRow[]; timeZone: string; showLink?: boolean; empty?: string }) {
  if (rows.length === 0) return <p className="card px-6 py-10 text-center text-sm text-muted">{empty}</p>;
  return (
    <div className="card overflow-x-auto p-1.5">
      <table className="w-full min-w-[820px] text-sm">
        <thead>
          <tr className="border-b border-line">
            <th className={TH}>Time</th>
            {showLink && <th className={TH}>Link</th>}
            {showLink && <th className={TH}>Owner</th>}
            <th className={TH}>Country</th>
            <th className={TH}>Platform</th>
            <th className={TH}>Device</th>
            <th className={TH}>Browser</th>
            <th className={TH}>Referrer</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((c) => (
            <tr key={c.id} className="transition hover:bg-hover">
              <td className={`${TD} whitespace-nowrap text-muted tabular-nums`}>{formatDateTime(c.clickedAt, timeZone)}</td>
              {showLink && (
                <td className={`${TD} max-w-[200px]`}>
                  <Link href={`/admin/links/${c.linkId}`} className="block truncate font-medium hover:underline">
                    {c.title || `/${c.slug}`}
                  </Link>
                </td>
              )}
              {showLink && (
                <td className={`${TD} max-w-[200px]`}>
                  <Link href={`/admin/users/${c.ownerId}`} className="block truncate text-[13px] text-muted hover:text-ink hover:underline">
                    {c.ownerEmail}
                  </Link>
                </td>
              )}
              <td className={`${TD} whitespace-nowrap`}>{countryLabel(c.country ?? "Unknown")}</td>
              <td className={`${TD} whitespace-nowrap`}>{c.platform}</td>
              <td className={`${TD} whitespace-nowrap text-muted`}>
                {c.device} · {c.os}
              </td>
              <td className={`${TD} whitespace-nowrap text-muted`}>{c.browser}</td>
              <td className={`${TD} max-w-[160px] truncate text-muted`}>{c.referrerHost ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
