"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { AppIcon } from "./logo";
import { SubmitButton } from "./submit-button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const isSignup = mode === "signup";

  return (
    <div className="w-full max-w-[400px]">
      <div className="mb-6 flex flex-col items-center text-center">
        <AppIcon size={64} />
        <h1 className="mt-5 font-display text-[26px] font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="mt-1 text-[15px] text-muted">
          {isSignup ? "Free, and it takes about 20 seconds." : "Log in to see your links and clicks."}
        </p>
      </div>

      <form action={formAction} className="card space-y-4 p-6 sm:p-7">
        {isSignup && (
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium">Name</span>
            <input name="name" className="input" autoComplete="name" defaultValue={state?.fields?.name} required />
          </label>
        )}

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium">Email</span>
          <input
            name="email"
            type="email"
            className="input"
            autoComplete="email"
            placeholder="you@example.com"
            defaultValue={state?.fields?.email}
            required
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-[13px] font-medium">Password</span>
          <input
            name="password"
            type="password"
            className="input"
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={isSignup ? 8 : undefined}
            required
          />
          {isSignup && <span className="text-xs text-muted">At least 8 characters.</span>}
        </label>

        {state?.error && (
          <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            {state.error}
          </p>
        )}

        <SubmitButton pendingText={isSignup ? "Creating account…" : "Logging in…"} className="btn w-full py-3">
          {isSignup ? "Create account" : "Log in"}
        </SubmitButton>
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New to Shortly? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-semibold text-link hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
