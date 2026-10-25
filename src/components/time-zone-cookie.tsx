"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Tells the server the browser's time zone (read by getViewerZone in
 * src/lib/timezone.ts), so "today" in the stats starts at the viewer's midnight.
 * On the first visit, or after travelling, it saves the zone and re-renders once.
 */
export function TimeZoneCookie() {
  const router = useRouter();

  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!zone) return;
    const value = encodeURIComponent(zone);
    if (document.cookie.split("; ").includes(`tz=${value}`)) return;
    document.cookie = `tz=${value}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
