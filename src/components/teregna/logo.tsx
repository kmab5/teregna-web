import { cn } from "@/lib/utils";

/**
 * The Teregna mark: three positions in a line. The leading one is filled -
 * that is the person being served. The two behind are outlined and shrink.
 *
 * Inherits `currentColor`, so the parent decides the colour. There is no rail:
 * a filled dot on a rounded bar reads as an iOS toggle switch, which is why it
 * was cut during design. The rail lives in the queue UI, not the logo.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 32"
      className={cn("h-5 w-10", className)}
      fill="none"
      aria-hidden
    >
      <circle cx="55" cy="16" r="5" stroke="currentColor" strokeWidth="3" opacity="0.32" />
      <circle cx="38" cy="16" r="8" stroke="currentColor" strokeWidth="4" opacity="0.6" />
      <circle cx="14" cy="16" r="12" fill="currentColor" />
    </svg>
  );
}

/** Mark plus wordmark. The Amharic subtitle is a meaning cue, not decoration. */
export function Logo({
  className,
  showAmharic = true,
}: {
  className?: string;
  showAmharic?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Mark className="h-5 w-10 shrink-0 text-primary" />
      <span className="flex flex-col leading-none">
        <span className="font-display text-lg font-semibold tracking-[-0.02em]">
          Teregna
        </span>
        {showAmharic ? (
          <span lang="am" className="am mt-0.5 text-[0.7rem] text-ink-muted">
            ተረኛ
          </span>
        ) : null}
      </span>
    </span>
  );
}
