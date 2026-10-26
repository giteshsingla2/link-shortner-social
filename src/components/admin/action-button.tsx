"use client";

/**
 * A one-button form for an admin server action, with hidden fields and an
 * optional "are you sure?" step for anything that can't be undone.
 */
export function ActionButton({
  action,
  fields,
  confirm,
  className = "btn-ghost",
  title,
  children,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: Record<string, string | number>;
  confirm?: string;
  className?: string;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (confirm && !window.confirm(confirm)) e.preventDefault();
      }}
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button type="submit" className={className} title={title}>
        {children}
      </button>
    </form>
  );
}
