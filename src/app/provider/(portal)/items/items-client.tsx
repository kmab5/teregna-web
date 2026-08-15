"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Package,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useMyProvider, useProviderItems } from "@/lib/queries";
import { deleteItem, reorderItems, setItemVisible, upsertItem } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { EmptyState } from "@/components/teregna/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useLocaleFormat } from "@/lib/use-locale-format";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/database.types";

export function ItemsClient() {
  const t = useT();
  const { money } = useLocaleFormat();
  const qc = useQueryClient();
  const { data: provider } = useMyProvider();
  const { data, isPending } = useProviderItems(provider?.id ?? "");

  const [editing, setEditing] = useState<Item | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Item | null>(null);

  const key = qk.providerItems(provider?.id ?? "");
  const items = data ?? [];

  function openEditor(item: Item | null) {
    setEditing(item);
    setSheetOpen(true);
  }

  const toggle = useMutation({
    mutationFn: ({ id, visible }: { id: string; visible: boolean }) =>
      setItemVisible(id, visible),
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setConfirmDelete(null);
      // Snapshots mean history survives the delete. Say so - it is reassuring.
      toast.success(t("it.removedTitle"), {
        description: t("it.removedBody"),
      });
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  /**
   * Reordering.
   *
   * Up/down buttons rather than drag-and-drop: dragging is unusable by
   * keyboard, awkward for screen readers, and fiddly on a phone - which is
   * where most providers are. Buttons work everywhere and need no library.
   *
   * Optimistic, because the list should move under your finger. The server is
   * still the authority: any failure rolls the order back.
   */
  const reorder = useMutation({
    mutationFn: (ordered: Item[]) =>
      reorderItems(provider!.id, ordered.map((i) => i.id)),
    onMutate: async (ordered) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<Item[]>(key);
      qc.setQueryData<Item[]>(key, ordered);
      return { previous };
    },
    onError: (e, _v, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      toast.error(t(errorKey(e) as never));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    reorder.mutate(next);
  }

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("it.title")}</h1>
          <p className="mt-1 text-ink-muted">
            {t("it.subtitle")}
          </p>
        </div>
        <Button onClick={() => openEditor(null)} className="w-full sm:w-auto">
          <Plus aria-hidden />
          {t("it.add")}
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t("it.emptyTitle")}
          body={t("it.emptyBody")}
          action={
            <Button onClick={() => openEditor(null)}>
              <Plus aria-hidden /> {t("it.addFirst")}
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            {t("it.orderNote")}
          </p>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "rounded-[var(--radius-md)] border border-border bg-surface p-3 elev-1",
                  "flex flex-col gap-3 sm:flex-row sm:items-center",
                  !item.is_visible && "opacity-70",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                {/* Order controls, first because they change what this row IS. */}
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                    aria-label={t("it.moveUp", { name: item.name })}
                    className="rounded-t-[var(--radius-sm)] px-1.5 py-0.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reorder.isPending}
                    aria-label={t("it.moveDown", { name: item.name })}
                    className="rounded-b-[var(--radius-sm)] px-1.5 py-0.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronDown className="size-4" aria-hidden />
                  </button>
                </div>

                <span className="w-5 shrink-0 font-mono tnum text-sm text-ink-muted">
                  {index + 1}
                </span>

                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block truncate font-medium hover:text-primary">
                    {item.name}
                  </span>
                  {item.description ? (
                    <span className="block truncate text-sm text-ink-muted">
                      {item.description}
                    </span>
                  ) : null}
                </button>
                </div>

                {/* Controls row. Wraps under the name on phones, sits inline
                    from 640px up. */}
                <div className="flex items-center gap-3 sm:shrink-0">
                <div className="flex shrink-0 flex-col items-end font-mono tnum text-sm text-ink-muted">
                  <div className="flex items-center gap-3">
                    {item.duration_minutes ? (
                      <span title={t("it.minutes")}>{item.duration_minutes}m</span>
                    ) : null}
                    <span>{money(item.price, item.currency)}</span>
                  </div>
                  {item.stock !== null ? (
                    <span
                      className={cn(
                        "text-xs",
                        item.is_depleted ? "text-warning" : "text-ink-muted",
                      )}
                      title={t.plural("stock.promised", item.committed)}
                    >
                      {item.is_depleted
                        ? t("stock.depleted")
                        : t.plural("stock.left", item.available ?? 0)}
                    </span>
                  ) : null}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:ml-0">
                  <Switch
                    checked={item.is_visible}
                    onCheckedChange={(v) =>
                      toggle.mutate({ id: item.id, visible: v })
                    }
                    aria-label={item.is_visible ? t("it.hideAria", { name: item.name }) : t("it.showAria", { name: item.name })}
                  />
                  {item.is_visible ? (
                    <Eye className="size-4 text-accent" aria-hidden />
                  ) : (
                    <EyeOff className="size-4 text-ink-muted" aria-hidden />
                  )}
                </div>

                {/* An explicit control. The name was clickable before, but
                    nothing said so, so nobody found it. */}
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    onClick={() => openEditor(item)}
                    aria-label={t("it.edit", { name: item.name })}
                    className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item)}
                    aria-label={t("it.removeAria", { name: item.name })}
                    className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {/*
        Keyed on open + item so the form remounts every time it is opened.
        Without this, abandoning an edit and reopening the same item showed the
        abandoned values instead of what is actually saved.
      */}
      <ItemSheet
        key={`${sheetOpen}-${editing?.id ?? "new"}`}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        item={editing}
        providerId={provider?.id}
        onSaved={() => qc.invalidateQueries({ queryKey: key })}
      />

      <Sheet
        open={Boolean(confirmDelete)}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <SheetContent title={t("it.confirmTitle", { name: confirmDelete?.name ?? "" })}>
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              {t("it.confirmBody")}
            </p>
            <p className="text-sm text-ink-muted">
              {t("it.confirmHint")}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                {t("it.keepIt")}
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
                disabled={remove.isPending}
              >
                {remove.isPending ? t("it.removing") : t("it.remove")}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

function ItemSheet({
  open,
  onOpenChange,
  item,
  providerId,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  item: Item | null;
  providerId: string | undefined;
  onSaved: () => void;
}) {
  const t = useT();
  // Initialised from props on mount. The parent remounts this on every open,
  // so there is no reset logic to get wrong.
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item?.price != null ? String(item.price) : "",
  );
  const [duration, setDuration] = useState(
    item?.duration_minutes != null ? String(item.duration_minutes) : "",
  );
  const [visible, setVisible] = useState(item?.is_visible ?? true);
  const [stock, setStock] = useState(item?.stock != null ? String(item.stock) : "");

  const save = useMutation({
    mutationFn: () =>
      upsertItem({
        ...(item ? { id: item.id } : { provider_id: providerId }),
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : null,
        duration_minutes: duration ? Number(duration) : null,
        // Blank means "stop counting", which the RPC distinguishes from omitted.
        stock: stock.trim() === "" ? null : Number(stock),
        is_visible: visible,
      }),
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
      toast.success(item ? t("it.updated") : t("it.added"));
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={item ? t("it.editTitle", { name: item.name }) : t("it.addTitle")}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">{t("it.name")}</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("it.namePlaceholder")}
              autoFocus
            />
          </div>

          <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="item-price">{t("it.price")}</Label>
              <Input
                id="item-price"
                type="number"
                min={0}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="150"
                className="font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-duration">
                {t("it.minutes")}
                <span className="ml-1.5 font-normal text-ink-muted">{t("common.optional")}</span>
              </Label>
              <Input
                id="item-duration"
                type="number"
                min={1}
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="30"
                className="font-mono"
              />
            </div>
          </div>
          <p className="-mt-2 text-xs text-ink-muted">
            {t("it.minutesHint")}
          </p>

          <div className="space-y-2">
            <Label htmlFor="item-stock">
              {t("stock.label")}
              <span className="ml-1.5 font-normal text-ink-muted">
                {t("common.optional")}
              </span>
            </Label>
            <Input
              id="item-stock"
              type="number"
              min={0}
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              placeholder={t("stock.untracked")}
              className="font-mono"
            />
            <p className="text-xs text-ink-muted">{t("it.stockHint")}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-desc">{t("it.description")}</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("it.descriptionPlaceholder")}
            />
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-3">
            <div>
              <Label htmlFor="item-visible">{t("it.visible")}</Label>
              <p className="text-xs text-ink-muted">
                {t("it.visibleHint")}
              </p>
            </div>
            <Switch
              id="item-visible"
              checked={visible}
              onCheckedChange={setVisible}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={() => save.mutate()}
              disabled={!name.trim() || save.isPending}
            >
              {save.isPending ? t("common.saving") : item ? t("common.save") : t("it.add")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
