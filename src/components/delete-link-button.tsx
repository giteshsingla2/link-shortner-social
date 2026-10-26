"use client";

import { deleteLink } from "@/app/actions/links";
import { TrashIcon } from "./icons";

/** Deletes a link after the person confirms; its clicks and stats go with it. */
export function DeleteLinkButton({ id, label }: { id: number; label: string }) {
  return (
    <form
      action={deleteLink}
      onSubmit={(e) => {
        if (!window.confirm(`Delete ${label}? It will stop working, and its clicks and stats will be removed.`)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="redirectTo" value="dashboard" />
      <button type="submit" className="btn-ghost text-danger">
        <TrashIcon size={15} />
        Delete
      </button>
    </form>
  );
}
