export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface p-4 elev-1">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">
        {label}
      </p>
      <p className="mt-1 font-mono tnum text-3xl font-semibold leading-none">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  );
}
