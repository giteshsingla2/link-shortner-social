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
