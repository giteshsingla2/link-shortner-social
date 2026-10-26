import type { Metadata } from "next";
import Link from "next/link";
import { ShieldIcon } from "@/components/icons";
import { Logo } from "@/components/logo";

export const metadata: Metadata = { title: "Link disabled · Shortly", robots: { index: false } };

export default function LinkDisabled() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-danger/10 text-danger">
          <ShieldIcon size={26} />
        </span>
        <h1 className="mt-5 font-display text-[26px] font-semibold tracking-tight">This link has been disabled</h1>
        <p className="mt-2 text-[15px] text-muted text-pretty">
          It was turned off by the site&apos;s administrators, for example because it was reported as spam or unsafe.
        </p>
        <Link href="/" className="btn mt-7 px-6">
          Go to the home page
        </Link>
      </div>
      <Logo />
    </div>
  );
}
