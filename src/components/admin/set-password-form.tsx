"use client";

import { useActionState, useState } from "react";
import { setUserPassword, type SetPasswordState } from "@/app/actions/admin";
import { SubmitButton } from "../submit-button";

/** Lets an admin give a locked-out user a new password, to pass on to them privately. */
export function SetPasswordForm({ userId }: { userId: number }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState<SetPasswordState, FormData>(setUserPassword, undefined);

  if (!open) {
    return (
      <button type="button" className="btn-ghost" onClick={() => setOpen(true)}>
        Set new password
      </button>
    );
  }

  return (
    <form action={formAction} className="flex w-full flex-col gap-2 sm:flex-row sm:items-start">
      <input type="hidden" name="id" value={userId} />
      <div className="flex-1 space-y-1">
        <input
          name="password"
          type="text"
          className="input"
          placeholder="New password (8+ characters)"
          minLength={8}
          autoComplete="new-password"
          required
          autoFocus
        />
        {state?.ok && <p className="text-xs font-medium text-good">Password changed. Share it with the user privately.</p>}
        {state && !state.ok && <p role="alert" className="text-xs text-danger">{state.error}</p>}
      </div>
      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…" className="btn py-2.5 text-sm">
          Save password
        </SubmitButton>
        <button type="button" className="btn-ghost py-2.5" onClick={() => setOpen(false)}>
          Close
        </button>
      </div>
    </form>
  );
}
