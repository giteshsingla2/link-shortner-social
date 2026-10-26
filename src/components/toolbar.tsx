import Link from "next/link";
import { ChevronLeftIcon } from "./icons";

/**
 * The uniform toolbar at the top of every dashboard page: glass that stays
 * put while content scrolls under it, title on the left, controls on the right.
 */
export function Toolbar({
  title,
  subtitle,
  backHref,
  children,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  backHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="bar sticky top-0 z-30 border-b border-line">
      <div className="mx-auto flex min-h-[60px] w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5 sm:px-6 lg:px-8">
        {backHref && (
          <Link href={backHref} className="btn-ghost h-9 w-9 shrink-0 px-0" aria-label="Back to all links">
            <ChevronLeftIcon size={18} />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-[19px] leading-tight font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
        </div>
        {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
      </div>
    </header>
  );
}
