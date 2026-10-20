import { UAParser } from "ua-parser-js";
import { isbot } from "isbot";

export type ClickInfo = {
  country: string | null;
  platform: string;
  device: string;
  os: string;
  browser: string;
  referrerHost: string | null;
};

/**
 * Link-preview fetchers (WhatsApp, Telegram, Slack, Discord...) open a link to
 * build a preview card. They are not people, so their hits are not counted.
 * isbot covers search engines and most of these; the extra list catches the rest.
 */
const PREVIEW_FETCHERS = /whatsapp|telegrambot|slackbot|discordbot|facebookexternalhit|twitterbot|linkedinbot|skypeuripreview|vkshare|pinterestbot|embedly|redditbot|applebot|google-inspectiontool/i;

export function isBotRequest(userAgent: string): boolean {
  if (!userAgent) return true;
  return isbot(userAgent) || PREVIEW_FETCHERS.test(userAgent);
}

/** Country code from the CDN header. Cloudflare sends cf-ipcountry; XX and T1 (Tor) mean unknown. */
export function detectCountry(headers: Headers): string | null {
  const raw =
    headers.get("cf-ipcountry") ??
    headers.get("x-vercel-ip-country") ??
    headers.get("x-country-code");
  if (!raw) return null;
  const code = raw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code) || code === "XX" || code === "T1") return null;
  return code;
}

function hostOf(referrer: string): string | null {
  try {
    return new URL(referrer).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Which app or site sent the visitor. In-app browsers name themselves in the
 * user agent, so those are checked first; the referrer covers the rest.
 */
export function detectPlatform(userAgent: string, referrerHost: string | null): string {
  const ua = userAgent.toLowerCase();
  const ref = referrerHost ?? "";

  if (ua.includes("instagram")) return "Instagram";
  if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab") || /(^|\.)facebook\.com$|(^|\.)fb\.com$/.test(ref)) return "Facebook";
  if (ua.includes("musical_ly") || ua.includes("bytedancewebview") || ua.includes("trill") || ref.endsWith("tiktok.com")) return "TikTok";
  if (ua.includes("snapchat") || ref.endsWith("snapchat.com")) return "Snapchat";
  if (ua.includes("linkedinapp") || ref.endsWith("linkedin.com") || ref === "lnkd.in") return "LinkedIn";
  if (ua.includes("pinterest") || ref.endsWith("pinterest.com")) return "Pinterest";
  if (ua.includes("telegram") || ref.endsWith("t.me") || ref.endsWith("telegram.org")) return "Telegram";
  if (ua.includes("whatsapp") || ref.endsWith("whatsapp.com")) return "WhatsApp";
  if (ref.endsWith("youtube.com") || ref === "youtu.be") return "YouTube";
  if (ref === "t.co" || ref.endsWith("twitter.com") || ref.endsWith("x.com")) return "X (Twitter)";
  if (ref.endsWith("reddit.com")) return "Reddit";
  if (/(^|\.)google\.[a-z.]+$/.test(ref)) return "Google";
  if (ref.endsWith("bing.com")) return "Bing";
  if (ref) return "Other website";
  return "Direct";
}

function cap(value: string | undefined, fallback: string, max = 32): string {
  return (value?.trim() || fallback).slice(0, max);
}

export function parseClick(headers: Headers): ClickInfo {
  const userAgent = headers.get("user-agent") ?? "";
  const referrerHost = hostOf(headers.get("referer") ?? "");
  const ua = new UAParser(userAgent).getResult();

  // ua-parser leaves device.type empty for ordinary desktops.
  const type = ua.device.type;
  const device =
    type === "mobile" ? "Mobile" : type === "tablet" ? "Tablet" : type === "smarttv" ? "TV" : type === "console" ? "Console" : type ? "Other" : "Desktop";

  return {
    country: detectCountry(headers),
    platform: detectPlatform(userAgent, referrerHost),
    device,
    os: cap(ua.os.name === "Mac OS" ? "macOS" : ua.os.name, "Unknown"),
    browser: cap(ua.browser.name, "Unknown"),
    referrerHost: referrerHost ? referrerHost.slice(0, 255) : null,
  };
}
