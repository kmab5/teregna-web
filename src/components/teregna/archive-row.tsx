"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "./request-status-badge";
import { formatDateTime } from "@/lib/format";
import type { ArchiveRow as ArchiveRowData } from "@/lib/database.types";

export function ArchiveRow({
  row,
  onRestore,
  pending,
}: {
  row: ArchiveRowData;
  onRestore: (id: string) => void;
  pending?: boolean;
}) {
  return (
    <li className="flex items-start gap-4 rounded-[var(--radius-md)] border border-border bg-surface p-4 elev-1">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-medium">{row.receiver_name}</p>
          <RequestStatusBadge status={row.status} />
          <span className="font-mono tnum text-xs text-ink-muted">
            {formatDateTime(row.archived_at)}
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
              </li>
            ))}
          </ul>
        ) : null}

        {row.note ? (
          <p className="mt-2 text-sm text-ink-muted">{row.note}</p>
        ) : null}
      </div>

      {/* Nothing is ever truly gone. Restore is always available. */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRestore(row.id)}
        disabled={pending}
        className="shrink-0"
      >
        <RotateCcw aria-hidden />
        Restore
      </Button>
    </li>
  );
}
