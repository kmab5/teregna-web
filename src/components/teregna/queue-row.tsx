"use client";

import { Play, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "./request-status-badge";
import { WaitTime } from "./wait-time";
import { useT } from "@/i18n/client";
import { useLocaleFormat } from "@/lib/use-locale-format";
import Link from "next/link";
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
  now,
}: {
  row: QueueRowData;
  onStart: (id: string) => void;
  onFinish: (id: string) => void;
  pending?: boolean;
  /** Ticking clock from the parent, so every row re-renders together. */
  now: number;
}) {
  const t = useT();
  const { money } = useLocaleFormat();
  const active = row.status === "in_progress";

  return (
    <li
      className={cn(
        "animate-queue-enter relative rounded-[var(--radius-md)] border bg-surface p-3 elev-1 transition-opacity sm:p-4 sm:pl-3",
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4",
        active ? "border-primary/50" : "border-border",
        pending && "opacity-50",
      )}
    >
      {/* Position marker, seated on the rail */}
      <div className="flex items-start gap-3 sm:contents">
      <div
        className={cn(
          "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 font-mono tnum text-base font-semibold",
          active
            ? "border-primary bg-primary text-on-primary"
            : "border-border bg-surface text-ink",
        )}
        aria-label={t("pq.positionAria", { position: row.position })}
      >
        {row.position}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
            href={`/orders/${row.id}`}
            className="font-medium hover:text-primary hover:underline"
          >
            {row.receiver_name}
          </Link>
          <RequestStatusBadge status={row.status} />
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
                    {money(it.price)}
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

      <WaitTime
        since={row.created_at}
        now={now}
        size="lg"
        className="ml-auto sm:hidden"
      />
      </div>

      <div className="flex shrink-0 items-end justify-between gap-3 sm:flex-col">
        <WaitTime
          since={row.created_at}
          now={now}
          size="lg"
          className="hidden sm:flex"
        />

        <div className="flex flex-1 gap-2 sm:flex-none">
          {row.status === "queued" ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onStart(row.id)}
              disabled={pending}
              className="flex-1 sm:flex-none"
            >
              <Play aria-hidden />
              {t("pq.start")}
            </Button>
          ) : null}
          <Button
            variant="accent"
            size="sm"
            onClick={() => onFinish(row.id)}
            disabled={pending}
            className="flex-1 sm:flex-none"
          >
            <Check aria-hidden />
            {t("pq.finish")}
          </Button>
        </div>
      </div>
    </li>
  );
}
