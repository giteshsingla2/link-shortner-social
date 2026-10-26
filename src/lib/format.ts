const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

export function countryName(code: string) {
  if (!code || code === "Unknown") return "Unknown";
  try {
    return countryNames.of(code) ?? code;
  } catch {
    return code;
  }
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("en").format(n);
}

export function formatDate(d: Date | string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export function prettyUrl(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

/** "IN" -> 🇮🇳, built from the two regional-indicator letters. Empty for unknown codes. */
export function countryFlag(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "";
  return String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

/** Country name with its flag in front, for breakdown lists. */
export function countryLabel(code: string) {
  const flag = countryFlag(code);
  // An en space, which HTML doesn't collapse like ordinary spaces.
  return flag ? `${flag}\u2002${countryName(code)}` : countryName(code);
}

/** "26 Oct, 9:41 AM" in the given time zone (the viewer's, for admin tables). */
export function formatDateTime(d: Date | string, timeZone: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone }).format(new Date(d));
}

/** Today against yesterday: "+25%", "−10%", "New" when yesterday was 0, "" when there's no change to show. */
export function formatChange(today: number, yesterday: number) {
  if (yesterday === 0) return today > 0 ? "New" : "";
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return pct === 0 ? "" : pct > 0 ? `+${pct}%` : `−${Math.abs(pct)}%`;
}
