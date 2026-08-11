"use client";

import { Check, X, Clock, Loader } from "lucide-react";
import { useT } from "@/i18n/client";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/database.types";

/**
 * Status is never signalled by colour alone: each state carries an icon and a
 * word as well. Colour is the third cue, not the only one.
 */
const CONFIG: Record<
  RequestStatus,
  { icon: typeof Check; className: string; dot?: boolean }
> = {
  queued: {
    icon: Clock,
    className: "text-ink-muted bg-muted",
  },
  in_progress: {
    icon: Loader,
    className: "text-primary bg-primary/10",
    dot: true,
  },
  completed: {
    icon: Check,
    className: "text-accent bg-accent/10",
  },
  cancelled: {
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
  const t = useT();
  const { icon: Icon, className: tone, dot } = CONFIG[status];
  const label = t(`status.${status}`);
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
