"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, signup, type AuthState } from "@/app/actions/auth";
import { SubmitButton } from "./submit-button";

export function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const action = mode === "login" ? login : signup;
  const [state, formAction] = useActionState<AuthState, FormData>(action, undefined);
  const isSignup = mode === "signup";

  return (
    <form action={formAction} className="card w-full max-w-sm space-y-4 p-6 sm:p-8">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          {isSignup ? "Create your account" : "Welcome back"}
        </h1>
        <p className="text-sm text-muted">
          {isSignup ? "Free. Takes about 20 seconds." : "Log in to see your links and clicks."}
        </p>
      </div>

      {isSignup && (
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Name</span>
          <input name="name" className="input" autoComplete="name" defaultValue={state?.fields?.name} required />
        </label>
      )}

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Email</span>
        <input
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          defaultValue={state?.fields?.email}
          required
        />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Password</span>
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
        <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      <SubmitButton pendingText={isSignup ? "Creating account…" : "Logging in…"} className="btn w-full">
        {isSignup ? "Sign up" : "Log in"}
      </SubmitButton>

      <p className="text-center text-sm text-muted">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link href={isSignup ? "/login" : "/signup"} className="font-medium text-accent hover:underline">
          {isSignup ? "Log in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
