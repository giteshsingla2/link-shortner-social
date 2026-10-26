const PALETTE = [
  ["#ffb340", "#f0562b"],
  ["#6ab0ff", "#2f6fe0"],
  ["#5fdc8c", "#1f9d55"],
  ["#ff8fa3", "#e64a6e"],
  ["#c39bff", "#7b4fe0"],
  ["#ffd65a", "#e8940c"],
  ["#5ad6d6", "#1a8f9e"],
];

function hostOf(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * A small squircle with the first letter of the link's destination, coloured
 * by the domain so the same site always gets the same colour. No favicon is
 * fetched, so nothing about the user's links goes to a third party.
 */
export function LinkAvatar({ url, size = 36 }: { url: string; size?: number }) {
  const host = hostOf(url);
  let hash = 0;
  for (const ch of host) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const [from, to] = PALETTE[hash % PALETTE.length];

  return (
    <span
      className="grid shrink-0 place-items-center font-display font-semibold text-white uppercase"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        fontSize: size * 0.44,
        background: `linear-gradient(150deg, ${from}, ${to})`,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,.4), 0 2px 6px -2px rgba(0,0,0,.25)",
      }}
      aria-hidden
    >
      {host.charAt(0) || "?"}
    </span>
  );
}
