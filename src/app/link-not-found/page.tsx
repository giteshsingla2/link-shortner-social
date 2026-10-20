import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Link not found · Shortly", robots: { index: false } };

export default function LinkNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-4 text-center">
      <Logo />
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">This link doesn&apos;t exist</h1>
        <p className="max-w-md text-muted">
          It may have been deleted, or there&apos;s a typo in the address. Short links are case-sensitive.
        </p>
      </div>
      <Link href="/" className="btn">
        Make your own short link
      </Link>
    </div>
  );
}
