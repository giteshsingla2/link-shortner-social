"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "./icons";

export function CopyButton({ text, label = "Copy", iconOnly = false }: { text: string; label?: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", text);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`btn-ghost shrink-0 ${iconOnly ? "h-9 w-9 px-0" : ""}`}
      aria-live="polite"
      aria-label={iconOnly ? (copied ? "Copied" : `Copy ${text}`) : undefined}
      title={iconOnly ? "Copy link" : undefined}
    >
      {copied ? <CheckIcon size={16} className="text-good" /> : <CopyIcon size={16} />}
      {!iconOnly && (copied ? "Copied" : label)}
    </button>
  );
}
