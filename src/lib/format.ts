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
