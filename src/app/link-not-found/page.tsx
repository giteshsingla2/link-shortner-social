import type { Metadata } from "next";
import Link from "next/link";
import { LinkIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Link not found · Shortly", robots: { index: false } };

export default function LinkNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-link">
          <LinkIcon size={26} />
        </span>
        <h1 className="mt-5 font-display text-[26px] font-semibold tracking-tight">This link doesn&apos;t exist</h1>
        <p className="mt-2 text-[15px] text-muted text-pretty">
          It may have been deleted, or there&apos;s a typo in the address. Check the link and try again.
        </p>
        <Link href="/" className="btn mt-7 px-6">
          Make your own short link
        </Link>
      </div>
      <Logo />
    </div>
  );
}
