import type { LucideIcon } from "lucide-react";

/** An empty screen is an invitation to act, not a shrug. */
export function EmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-border px-6 py-14 text-center">
      <Icon className="mb-4 size-8 text-ink-muted" aria-hidden />
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-ink-muted">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
