"use client";

import { useEffect, useState } from "react";
import { Play, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "./request-status-badge";
import { formatBirr, waitingSince } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QueueRow as QueueRowData } from "@/lib/database.types";

/**
 * One person waiting.
 *
 * The position number is the signature element: mono, large, sitting on the
 * rail that runs down the queue. Order is the product, so order is what the
 * eye lands on first.
 */
export function QueueRow({
  row,
  onStart,
  onFinish,
  pending,
}: {
  row: QueueRowData;
  onStart: (id: string) => void;
  onFinish: (id: string) => void;
  pending?: boolean;
}) {
  // The wait time is the one number that must never look frozen.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  const active = row.status === "in_progress";

  return (
    <li
      className={cn(
        "animate-queue-enter relative flex items-start gap-4 rounded-[var(--radius-md)] border bg-surface p-4 pl-3 elev-1 transition-opacity",
        active ? "border-primary/50" : "border-border",
        pending && "opacity-50",
      )}
    >
      {/* Position marker, seated on the rail */}
      <div
        className={cn(
          "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-mono tnum text-base font-semibold",
          active
            ? "border-primary bg-primary text-on-primary"
            : "border-border bg-surface text-ink",
        )}
        aria-label={`Position ${row.position}`}
      >
        {row.position}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-medium">{row.receiver_name}</p>
          <RequestStatusBadge status={row.status} />
          <span className="font-mono tnum text-xs text-ink-muted">
            waiting {waitingSince(row.created_at, now)}
          </span>
        </div>

        {row.items.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {row.items.map((it, i) => (
              <li
                key={`${it.item_id ?? it.name}-${i}`}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                {it.quantity > 1 ? (
                  <span className="font-mono tnum">{it.quantity}× </span>
                ) : null}
                {it.name}
                {it.price != null ? (
                  <span className="ml-1 text-ink-muted">
                    {formatBirr(it.price)}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : null}

        {row.note ? (
          <p className="mt-2 flex items-start gap-1.5 text-sm text-ink-muted">
            <MessageSquare className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            {row.note}
          </p>
        ) : null}
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
        {row.status === "queued" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onStart(row.id)}
            disabled={pending}
          >
            <Play aria-hidden />
            Start
          </Button>
        ) : null}
        <Button
          variant="accent"
          size="sm"
          onClick={() => onFinish(row.id)}
          disabled={pending}
        >
          <Check aria-hidden />
          Finish
        </Button>
      </div>
    </li>
  );
}
