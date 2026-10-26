"use client";

import { useActionState, useState } from "react";
import { updateLink, type UpdateLinkState } from "@/app/actions/links";
import { PencilIcon } from "./icons";
import { SubmitButton } from "./submit-button";

type EditableLink = { id: number; url: string; title: string | null };

/**
 * The header card on a link's stats page: the link's details (children), its
 * buttons (actions), and an Edit button that opens a form to change where the
 * link goes and its title.
 */
export function LinkHeader({
  link,
  actions,
  children,
}: {
  link: EditableLink;
  actions: React.ReactNode;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="card p-5 sm:p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">{children}</div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            <PencilIcon size={15} />
            Edit
          </button>
          {actions}
        </div>
      </div>
      {/* Mounted only while open, so a past error doesn't show when it's reopened. */}
      {editing && <EditLinkForm link={link} onDone={() => setEditing(false)} />}
    </section>
  );
}

function EditLinkForm({ link, onDone }: { link: EditableLink; onDone: () => void }) {
  const [state, formAction] = useActionState<UpdateLinkState, FormData>(async (prev, formData) => {
    const result = await updateLink(prev, formData);
    if (result?.ok) onDone();
    return result;
  }, undefined);
  // React resets the form after each submit. On an error, what the user typed
  // comes back through defaultValue so they don't have to retype it.
  const fields = state && !state.ok ? state.fields : undefined;

  return (
    <form action={formAction} className="mt-5 space-y-3 border-t border-line pt-5">
      <input type="hidden" name="id" value={link.id} />
      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium">Destination</span>
        <input
          name="url"
          className="input"
          defaultValue={fields?.url ?? link.url}
          placeholder="https://example.com/new/page"
          autoComplete="off"
          required
          autoFocus
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-[13px] font-medium">Title (only you see this)</span>
        <input name="title" className="input" defaultValue={fields?.title ?? link.title ?? ""} maxLength={255} />
      </label>
      <p className="text-xs text-muted">
        The short link stays the same and keeps its clicks and stats. New clicks go to the new destination straight away.
      </p>

      {state && !state.ok && (
        <p role="alert" className="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      <div className="flex gap-2">
        <SubmitButton pendingText="Saving…" className="btn">
          Save
        </SubmitButton>
        <button type="button" className="btn-ghost" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
