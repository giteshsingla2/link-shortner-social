"use server";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession, deleteSession } from "@/lib/session";

export type AuthState = { error?: string; fields?: Record<string, string> } | undefined;

const signupSchema = z.object({
  name: z.string().trim().min(1, "Enter your name").max(100),
  email: z.email("Enter a valid email").max(255).transform((e) => e.toLowerCase()),
  password: z.string().min(8, "Password needs at least 8 characters").max(200),
});

const loginSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase()),
  password: z.string().min(1, "Enter your password"),
});

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = signupSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { name: raw.name, email: raw.email } };
  }
  const { name, email, password } = parsed.data;

  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  if (existing) {
    return { error: "An account with this email already exists. Try logging in.", fields: { name, email } };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const [result] = await db.insert(users).values({ name, email, passwordHash }).$returningId();

  await createSession(result.id);
  redirect("/dashboard");
}

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const raw = Object.fromEntries(formData) as Record<string, string>;
  const parsed = loginSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, fields: { email: raw.email } };
  }
  const { email, password } = parsed.data;

  const [user] = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  // Same message for unknown email and wrong password, so nobody can probe which emails exist.
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Email or password is wrong.", fields: { email } };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
