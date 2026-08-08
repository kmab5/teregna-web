"use client";

import { Clock } from "lucide-react";
import { elapsed } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * How long someone has been waiting.
 *
 * Shown as a real number rather than a relative phrase, because a provider
 * scanning a queue is comparing durations down a column - "23" against "4" is
 * legible at a glance in a way "a few minutes ago" is not. Tabular figures keep
 * the digits aligned.
 *
 * Colour escalates past 20 and 45 minutes, but the number itself always carries
 * the information, so colour is never the only signal.
 */
export function WaitTime({
  since,
  now,
  size = "sm",
  className,
}: {
  since: string;
  now: number;
  size?: "sm" | "lg";
  className?: string;
}) {
  const { value, unit, minutes } = elapsed(since, now);

  const tone =
    minutes >= 45
      ? "text-destructive"
      : minutes >= 20
        ? "text-warning"
        : "text-ink-muted";

  if (size === "lg") {
    return (
      <div className={cn("flex flex-col items-end leading-none", className)}>
        <span className={cn("font-mono tnum text-2xl font-semibold", tone)}>
          {value}
        </span>
        <span className="mt-0.5 text-[0.65rem] uppercase tracking-wide text-ink-muted">
          {unit} waiting
        </span>
      </div>
    );
  }

  return (
    <span
      className={cn("inline-flex items-center gap-1 text-xs", tone, className)}
      title={`Waiting ${value} ${unit}`}
    >
      <Clock className="size-3.5" aria-hidden />
      <span className="font-mono tnum font-medium">{value}</span>
      <span>{unit} waiting</span>
    </span>
  );
}
