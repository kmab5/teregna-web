import { formatBirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/database.types";

export function ItemRow({
  item,
  selected,
  quantity,
  onToggle,
  onQuantity,
}: {
  item: Item;
  selected?: boolean;
  quantity?: number;
  onToggle?: () => void;
  onQuantity?: (n: number) => void;
}) {
  const interactive = Boolean(onToggle);

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
          aria-label={`Add ${item.name}`}
          className="size-5 accent-[var(--primary)]"
        />
      ) : null}

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        {item.description ? (
          <p className="truncate text-sm text-ink-muted">{item.description}</p>
        ) : null}
      </div>

      {selected && onQuantity ? (
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => onQuantity(Math.max(1, (quantity ?? 1) - 1))}
            aria-label={`Fewer ${item.name}`}
            className="size-8 rounded-[var(--radius-sm)] border border-border text-ink-muted hover:bg-muted"
          >
            −
          </button>
          <span className="w-6 text-center font-mono tnum text-sm">
            {quantity ?? 1}
          </span>
          <button
            type="button"
            onClick={() => onQuantity(Math.min(99, (quantity ?? 1) + 1))}
            aria-label={`More ${item.name}`}
            className="size-8 rounded-[var(--radius-sm)] border border-border text-ink-muted hover:bg-muted"
          >
            +
          </button>
        </div>
      ) : null}

      <span className="shrink-0 font-mono tnum text-sm text-ink-muted">
        {formatBirr(item.price, item.currency)}
      </span>
    </div>
  );
}
