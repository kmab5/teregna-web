import { Check, X, Clock, Loader } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/database.types";

/**
 * Status is never signalled by colour alone: each state carries an icon and a
 * word as well. Colour is the third cue, not the only one.
 */
const CONFIG: Record<
  RequestStatus,
  { label: string; icon: typeof Check; className: string; dot?: boolean }
> = {
  queued: {
    label: "Queued",
    icon: Clock,
    className: "text-ink-muted bg-muted",
  },
  in_progress: {
    label: "In progress",
    icon: Loader,
    className: "text-primary bg-primary/10",
    dot: true,
  },
  completed: {
    label: "Completed",
    icon: Check,
    className: "text-accent bg-accent/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: X,
    className: "text-destructive bg-destructive/10",
  },
};

export function RequestStatusBadge({
  status,
  position,
  className,
}: {
  status: RequestStatus;
  position?: number | null;
  className?: string;
}) {
  const { label, icon: Icon, className: tone, dot } = CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone,
        className,
      )}
    >
      <Icon className={cn("size-3.5", dot && "animate-pulse-dot")} aria-hidden />
      {label}
      {status === "queued" && position ? (
        <span className="font-mono tnum">· #{position}</span>
      ) : null}
    </span>
  );
}
