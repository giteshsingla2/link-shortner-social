import "server-only";
import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "./session";

export type CurrentUser = { id: number; name: string; email: string; isAdmin: boolean };

/**
 * Admins are the accounts whose email is in ADMIN_EMAILS (comma separated).
 * Kept out of the database on purpose: nothing inside the app can make
 * someone an admin, only whoever controls the server's .env.
 */
export function isAdminEmail(email: string) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.toLowerCase());
}

/**
 * Reads the session cookie and loads the user. Sends the visitor to /login when
 * they're not signed in, or their account is gone or suspended. Wrapped in
 * React cache so several components in one request share a single lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email, suspendedAt: users.suspendedAt })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Valid cookie but the account is gone or suspended: clear the cookie, then go to login.
  if (!user || user.suspendedAt) redirect("/auth/clear");
  return { id: user.id, name: user.name, email: user.email, isAdmin: isAdminEmail(user.email) };
});

/** For pages and server actions in /admin. Anyone who isn't an admin gets a plain 404. */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user.isAdmin) notFound();
  return user;
}

/**
 * For server actions that change a user's own links: the session must be valid
 * and the account must exist and not be suspended.
 */
export async function requireActiveUserId(): Promise<number> {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  const [user] = await db.select({ suspendedAt: users.suspendedAt }).from(users).where(eq(users.id, userId)).limit(1);
  if (!user || user.suspendedAt) redirect("/auth/clear");
  return userId;
}
