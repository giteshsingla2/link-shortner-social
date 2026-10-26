"use client";

import { useActionState, useState } from "react";
import { createLink, type CreateLinkState } from "@/app/actions/links";
import { CopyButton } from "./copy-button";
import { CheckIcon, LinkIcon } from "./icons";
import { SubmitButton } from "./submit-button";

export function CreateLinkForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction] = useActionState<CreateLinkState, FormData>(createLink, undefined);
  const [showOptions, setShowOptions] = useState(false);
  // React resets the form after each submit. On an error, the fields come back
  // through defaultValue so the user doesn't have to retype them.
  const fields = state && !state.ok ? state.fields : undefined;
  const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="card p-4 sm:p-6">
      <div className="mb-4">
        <h2 className="font-display text-[19px] font-semibold tracking-tight">Create a short link</h2>
        <p className="text-sm text-muted">Paste any long address. You&apos;ll get a short one that counts every click.</p>
      </div>

      <form action={formAction} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="url">Long URL</label>
          <div className="input flex items-center gap-2.5 py-0 sm:flex-1">
            <LinkIcon size={17} className="shrink-0 text-muted" />
            <input
              id="url"
              name="url"
              className="w-full bg-transparent py-3 outline-none placeholder:text-muted/70"
              placeholder="https://example.com/a/very/long/page"
              defaultValue={fields?.url}
              autoComplete="off"
              required
            />
          </div>
          <SubmitButton pendingText="Shortening…" className="btn py-3 sm:w-36">
            Shorten
          </SubmitButton>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="text-[13px] font-medium text-link hover:underline"
          aria-expanded={showOptions}
        >
          {showOptions ? "Hide options" : "Add a custom ending or title"}
        </button>

        {/* Kept in the DOM (just hidden) so values survive toggling. */}
        <div className={showOptions ? "grid gap-3 sm:grid-cols-2" : "hidden"}>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium">Custom ending</span>
            <div className="input flex items-center py-0">
              <span className="text-sm text-muted">{host}/</span>
              <input
                name="slug"
                className="w-full bg-transparent px-1 py-2.5 outline-none placeholder:text-muted/70"
                placeholder="summer-sale"
                defaultValue={fields?.slug}
                pattern="[a-zA-Z0-9_\-]{3,64}"
              />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-[13px] font-medium">Title (only you see this)</span>
            <input name="title" className="input" placeholder="Instagram bio link" defaultValue={fields?.title} maxLength={255} />
          </label>
        </div>
      </form>

      {state && !state.ok && (
        <p role="alert" className="mt-3 rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-line p-3.5 sm:flex-row sm:items-center" style={{ background: "var(--accent-soft)" }}>
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-good text-white">
            <CheckIcon size={18} strokeWidth={2.4} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-muted">Your short link is ready</p>
            <a href={state.shortUrl} target="_blank" rel="noreferrer" className="block truncate font-mono text-[15px] font-semibold text-link">
              {state.shortUrl}
            </a>
          </div>
          <CopyButton text={state.shortUrl} />
        </div>
      )}
    </div>
  );
}
