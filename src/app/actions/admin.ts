"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { links, users } from "@/db/schema";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { clearLinkCache, forgetLink } from "@/lib/link-cache";

/*
 * Admin-only actions. Each one calls requireAdmin() itself, because server
 * actions can be called directly, not only from the admin pages.
 */

/** The user an admin is about to act on. Admin accounts (ADMIN_EMAILS) are off limits, so admins can't lock each other or themselves out. */
async function targetUser(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return null;
  const [user] = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  if (!user || isAdminEmail(user.email)) return null;
  return user;
}

export async function setUserSuspended(formData: FormData) {
  await requireAdmin();
  const user = await targetUser(formData);
  if (!user) return;

  const suspend = formData.get("suspend") === "1";
  await db.update(users).set({ suspendedAt: suspend ? new Date() : null }).where(eq(users.id, user.id));
  // Their links switch between working and disabled, all at once.
  clearLinkCache();
  refresh();
}

export async function deleteUser(formData: FormData) {
  await requireAdmin();
  const user = await targetUser(formData);
  if (!user) return;

  // Links and clicks go with the user (ON DELETE CASCADE).
  await db.delete(users).where(eq(users.id, user.id));
  clearLinkCache();
  redirect("/admin/users");
}

export type SetPasswordState = { ok: true } | { ok: false; error: string } | undefined;

/** There's no "forgot password" email yet, so an admin can set a new one for a user who's locked out. */
export async function setUserPassword(_prev: SetPasswordState, formData: FormData): Promise<SetPasswordState> {
  await requireAdmin();
  const user = await targetUser(formData);
  if (!user) return { ok: false, error: "This user can't be changed here." };

  const password = String(formData.get("password") ?? "");
  if (password.length < 8 || password.length > 200) {
    return { ok: false, error: "The new password needs at least 8 characters." };
  }
  await db.update(users).set({ passwordHash: await bcrypt.hash(password, 10) }).where(eq(users.id, user.id));
  return { ok: true };
}

async function targetLink(formData: FormData) {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id)) return null;
  const [link] = await db.select({ id: links.id, slug: links.slug }).from(links).where(eq(links.id, id)).limit(1);
  return link ?? null;
}

export async function setLinkDisabled(formData: FormData) {
  await requireAdmin();
  const link = await targetLink(formData);
  if (!link) return;

  const disable = formData.get("disable") === "1";
  await db.update(links).set({ disabledAt: disable ? new Date() : null }).where(eq(links.id, link.id));
  forgetLink(link.slug);
  refresh();
}

export async function adminDeleteLink(formData: FormData) {
  await requireAdmin();
  const link = await targetLink(formData);
  if (!link) return;

  await db.delete(links).where(eq(links.id, link.id));
  forgetLink(link.slug);
  const back = String(formData.get("redirectTo") ?? "");
  if (back.startsWith("/admin")) redirect(back);
  refresh();
}
