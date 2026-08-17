"use client";

import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "./request-status-badge";
import Link from "next/link";
import { useT } from "@/i18n/client";
import { useLocaleFormat } from "@/lib/use-locale-format";
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
  const t = useT();
  const { dateTime } = useLocaleFormat();
  return (
    <li className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 elev-1 sm:flex-row sm:items-start sm:gap-4 sm:p-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Link
          href={`/orders/${row.id}`}
          className="font-medium hover:text-primary hover:underline"
        >
          {row.receiver_name}
        </Link>
          <RequestStatusBadge status={row.status} />
          <span className="font-mono tnum text-xs text-ink-muted">
            {dateTime(row.archived_at)}
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
        className="w-full shrink-0 sm:w-auto"
      >
        <RotateCcw aria-hidden />
        {t("arc.restore")}
      </Button>
    </li>
  );
}
