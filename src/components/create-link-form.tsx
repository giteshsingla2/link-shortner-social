"use client";

import { useActionState, useState } from "react";
import { createLink, type CreateLinkState } from "@/app/actions/links";
import { CopyButton } from "./copy-button";
import { SubmitButton } from "./submit-button";

export function CreateLinkForm({ baseUrl }: { baseUrl: string }) {
  const [state, formAction] = useActionState<CreateLinkState, FormData>(createLink, undefined);
  const [showOptions, setShowOptions] = useState(false);
  // React resets the form after each submit. On an error, the fields come back
  // through defaultValue so the user doesn't have to retype them.
  const fields = state && !state.ok ? state.fields : undefined;
  const host = baseUrl.replace(/^https?:\/\//, "").replace(/\/$/, "");

  return (
    <div className="card p-4 sm:p-5">
      <form action={formAction} className="space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="url">Long URL</label>
          <input
            id="url"
            name="url"
            className="input sm:flex-1"
            placeholder="Paste a long link, e.g. https://example.com/very/long/page"
            defaultValue={fields?.url}
            autoComplete="off"
            required
          />
          <SubmitButton pendingText="Shortening…" className="btn sm:w-36">
            Shorten
          </SubmitButton>
        </div>

        <button
          type="button"
          onClick={() => setShowOptions((v) => !v)}
          className="text-sm font-medium text-muted hover:text-ink"
          aria-expanded={showOptions}
        >
          {showOptions ? "Hide options" : "Custom ending or title"}
        </button>

        {/* Kept in the DOM (just hidden) so values survive toggling. */}
        <div className={showOptions ? "grid gap-3 sm:grid-cols-2" : "hidden"}>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Custom ending</span>
            <div className="flex items-center rounded-lg border border-line bg-surface focus-within:border-accent">
              <span className="pl-3 text-sm text-muted">{host}/</span>
              <input
                name="slug"
                className="w-full bg-transparent px-1 py-2.5 text-[15px] outline-none"
                placeholder="summer-sale"
                defaultValue={fields?.slug}
                pattern="[a-zA-Z0-9_\-]{3,64}"
              />
            </div>
          </label>
          <label className="block space-y-1.5">
            <span className="text-sm font-medium">Title (only you see this)</span>
            <input name="title" className="input" placeholder="Instagram bio link" defaultValue={fields?.title} maxLength={255} />
          </label>
        </div>
      </form>

      {state && !state.ok && (
        <p role="alert" className="mt-3 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}

      {state?.ok && (
        <div className="mt-4 flex flex-col gap-3 rounded-lg bg-accent-soft p-3 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Your short link</p>
            <a href={state.shortUrl} target="_blank" rel="noreferrer" className="block truncate font-mono text-[15px] font-medium text-accent">
              {state.shortUrl}
            </a>
          </div>
          <CopyButton text={state.shortUrl} />
        </div>
      )}
    </div>
  );
}
