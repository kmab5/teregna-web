"use client";

import { TriangleAlert } from "lucide-react";
import { useT, useLocale } from "@/i18n/client";
import { INTL_LOCALE } from "@/i18n/config";
import { elapsed } from "@/lib/format";
import type { OrderDetail } from "@/lib/database.types";

/**
 * The parts of an order that depend on the current time.
 *
 * Split into a client component because "placed 40 minutes ago, past the 30 you
 * allowed" is only true at the moment it renders. Computing it on the server
 * would freeze it at build or request time and quietly go stale on a page
 * someone leaves open.
 */
export function OrderMeta({
  order,
  isProvider,
}: {
  order: OrderDetail;
  isProvider: boolean;
}) {
  const t = useT();
  const locale = useLocale();

  const waited = elapsed(order.created_at).minutes;
  const overdue =
    order.status === "queued" &&
    order.expected_minutes > 0 &&
    waited > order.expected_minutes;

  const placed = new Intl.DateTimeFormat(INTL_LOCALE[locale], {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(order.created_at));

  return (
    <div className="mt-2 space-y-3">
      <p className="font-mono tnum text-sm text-ink-muted">
        {t("order.placed")} · {placed}
      </p>

      {/* Only shown to the provider: it is their allowance that has been
          exceeded, and telling a waiting customer they are overdue helps nobody. */}
      {overdue && isProvider ? (
        <p
          role="status"
          className="inline-flex items-center gap-2 rounded-[var(--radius-sm)] bg-warning/10 px-3 py-2 text-sm font-medium text-warning"
        >
          <TriangleAlert className="size-4" aria-hidden />
          {t("order.overdue")}
        </p>
      ) : null}
    </div>
  );
}
