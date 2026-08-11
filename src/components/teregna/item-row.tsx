"use client";

import { PackageX } from "lucide-react";
import { useT } from "@/i18n/client";
import { useLocaleFormat } from "@/lib/use-locale-format";
import { cn } from "@/lib/utils";
import type { ItemView } from "@/lib/database.types";

/**
 * One thing a provider offers.
 *
 * Stock, when tracked, is shown as what is left *after the people already
 * queued* - not raw shelf count. A depleted item is still selectable: the
 * provider may restock, someone ahead may cancel, and it is their call, not
 * ours. So it reads as information, never as a locked door.
 */
export function ItemRow({
  item,
  selected,
  quantity,
  onToggle,
  onQuantity,
}: {
  item: ItemView;
  selected?: boolean;
  quantity?: number;
  onToggle?: () => void;
  onQuantity?: (n: number) => void;
}) {
  const t = useT();
  const { money } = useLocaleFormat();
  const interactive = Boolean(onToggle);
  const tracked = item.stock !== null;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[var(--radius-sm)] border p-3 transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border bg-surface",
      )}
    >
      {interactive ? (
        <input
          type="checkbox"
          checked={Boolean(selected)}
          onChange={onToggle}
          aria-label={t("send.addAria", { name: item.name })}
          className="size-5 shrink-0 accent-[var(--primary)]"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        {item.description ? (
          <p className="truncate text-sm text-ink-muted">{item.description}</p>
        ) : null}

        {tracked ? (
          item.is_depleted ? (
            <p className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-warning">
              <PackageX className="size-3.5" aria-hidden />
              {t("stock.depleted")}
            </p>
          ) : (
            <p className="mt-1 text-xs text-ink-muted">
              <span className="font-mono tnum">
                {t.plural("stock.left", item.available ?? 0)}
              </span>
            </p>
          )
        ) : null}
      </div>

      {selected && onQuantity ? (
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onQuantity(Math.max(1, (quantity ?? 1) - 1))}
            aria-label={t("send.fewerAria", { name: item.name })}
            className="size-9 rounded-[var(--radius-sm)] border border-border text-ink-muted hover:bg-muted"
          >
            −
          </button>
          <span className="w-6 text-center font-mono tnum text-sm">
            {quantity ?? 1}
          </span>
          <button
            type="button"
            onClick={() => onQuantity(Math.min(99, (quantity ?? 1) + 1))}
            aria-label={t("send.moreAria", { name: item.name })}
            className="size-9 rounded-[var(--radius-sm)] border border-border text-ink-muted hover:bg-muted"
          >
            +
          </button>
        </div>
      ) : null}

      <span className="shrink-0 font-mono tnum text-sm text-ink-muted">
        {money(item.price, item.currency)}
      </span>
    </div>
  );
}
