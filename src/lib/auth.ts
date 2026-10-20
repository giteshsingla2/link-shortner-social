import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSessionUserId } from "./session";

export type CurrentUser = { id: number; name: string; email: string };

/**
 * Reads the session cookie and loads the user. Sends the visitor to /login when
 * they're not signed in. Wrapped in React cache so several components in one
 * request share a single lookup.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser> => {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");

  const [user] = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // Valid cookie but the account is gone: clear the cookie, then go to login.
  if (!user) redirect("/auth/clear");
  return user;
});
