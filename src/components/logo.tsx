import Link from "next/link";

/**
 * The app icon: a squircle with the golden-hour gradient, a glossy top
 * highlight and a white link glyph, sized like a macOS Dock icon.
 */
export function AppIcon({ size = 28 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center overflow-hidden text-white"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: "linear-gradient(145deg, #ffc24a 0%, #ff7a3d 48%, #e8432a 100%)",
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.55), inset 0 -1px 0 rgba(0,0,0,.12), 0 ${size * 0.12}px ${size * 0.35}px -${size * 0.12}px rgba(232,67,42,.7)`,
      }}
      aria-hidden
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,.35), rgba(255,255,255,0))" }}
      />
      <svg viewBox="0 0 24 24" width={size * 0.58} height={size * 0.58} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="relative">
        <path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1" />
        <path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 font-display text-[17px] font-semibold tracking-tight">
      <AppIcon />
      Shortly
    </Link>
  );
}
