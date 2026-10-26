import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 py-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-1 text-[13px] font-medium text-muted transition hover:text-ink">
          <ChevronLeftIcon size={15} />
          Home
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pt-6 pb-16 sm:items-center sm:pt-0">{children}</main>
    </div>
  );
}
