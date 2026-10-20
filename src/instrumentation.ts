/** Runs once when the Next.js server starts. */
export async function register() {
  // Only on the Node.js server, and not while `next build` prerenders pages.
  if (process.env.NEXT_RUNTIME !== "nodejs" || process.env.NEXT_PHASE === "phase-production-build") return;

  const { startClickRollup } = await import("./lib/rollup");
  startClickRollup();
}
