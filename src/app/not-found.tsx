import Link from "next/link";
import { Logo } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <div className="card w-full max-w-md p-8 text-center sm:p-10">
        <p className="font-display text-5xl font-bold tracking-tight text-link">404</p>
        <h1 className="mt-3 font-display text-[24px] font-semibold tracking-tight">Page not found</h1>
        <p className="mt-2 text-[15px] text-muted">There&apos;s nothing at this address.</p>
        <Link href="/" className="btn mt-7 px-6">
          Go to the home page
        </Link>
      </div>
      <Logo />
    </div>
  );
}
