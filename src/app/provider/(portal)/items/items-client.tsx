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
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { EmptyState } from "@/components/teregna/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { formatBirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/database.types";

export function ItemsClient() {
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
    onError: (e) => toast.error(errorMessage(e)),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key });
      setConfirmDelete(null);
      // Snapshots mean history survives the delete. Say so - it is reassuring.
      toast.success("Item removed", {
        description: "Past requests keep the name and price they were sent with.",
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
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
      toast.error(errorMessage(e));
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
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">Items</h1>
          <p className="mt-1 text-ink-muted">
            Hidden items disappear for customers straight away. Nothing already
            requested is affected.
          </p>
        </div>
        <Button onClick={() => openEditor(null)}>
          <Plus aria-hidden />
          Add item
        </Button>
      </header>

      {items.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Nothing listed yet"
          body="Add what you offer so customers know what to ask for."
          action={
            <Button onClick={() => openEditor(null)}>
              <Plus aria-hidden /> Add your first item
            </Button>
          }
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-ink-muted">
            Customers see them in this order.
          </p>
          <ul className="space-y-2">
            {items.map((item, index) => (
              <li
                key={item.id}
                className={cn(
                  "flex flex-wrap items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 elev-1 sm:flex-nowrap",
                  !item.is_visible && "opacity-70",
                )}
              >
                {/* Order controls, first because they change what this row IS. */}
                <div className="flex shrink-0 flex-col">
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0 || reorder.isPending}
                    aria-label={`Move ${item.name} up`}
                    className="rounded-t-[var(--radius-sm)] px-1.5 py-0.5 text-ink-muted transition-colors hover:bg-muted hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
                  >
                    <ChevronUp className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === items.length - 1 || reorder.isPending}
                    aria-label={`Move ${item.name} down`}
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

                <div className="flex shrink-0 items-center gap-3 font-mono tnum text-sm text-ink-muted">
                  {item.duration_minutes ? (
                    <span title="Typical minutes">{item.duration_minutes}m</span>
                  ) : null}
                  <span>{formatBirr(item.price, item.currency)}</span>
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  <Switch
                    checked={item.is_visible}
                    onCheckedChange={(v) =>
                      toggle.mutate({ id: item.id, visible: v })
                    }
                    aria-label={`${item.is_visible ? "Hide" : "Show"} ${item.name} from customers`}
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
                    aria-label={`Edit ${item.name}`}
                    className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-primary"
                  >
                    <Pencil className="size-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(item)}
                    aria-label={`Remove ${item.name}`}
                    className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-destructive"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
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
        <SheetContent title={`Remove ${confirmDelete?.name ?? "item"}?`}>
          <div className="space-y-4">
            <p className="text-sm text-ink-muted">
              Customers will stop seeing it immediately. Requests that already
              included it keep the name and price they were sent with, so your
              history stays accurate.
            </p>
            <p className="text-sm text-ink-muted">
              If you only want to take it off the menu for now, hide it instead —
              that is reversible.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmDelete(null)}
              >
                Keep it
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => confirmDelete && remove.mutate(confirmDelete.id)}
                disabled={remove.isPending}
              >
                {remove.isPending ? "Removing…" : "Remove"}
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

  const save = useMutation({
    mutationFn: () =>
      upsertItem({
        ...(item ? { id: item.id } : { provider_id: providerId }),
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : null,
        duration_minutes: duration ? Number(duration) : null,
        is_visible: visible,
      }),
    onSuccess: () => {
      onSaved();
      onOpenChange(false);
      toast.success(item ? "Item updated" : "Item added");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent title={item ? `Edit ${item.name}` : "Add an item"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Haircut"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-price">Price (ETB)</Label>
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
                Minutes
                <span className="ml-1.5 font-normal text-ink-muted">optional</span>
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
            Minutes are not shown to customers yet. They will be used to estimate
            waiting times.
          </p>

          <div className="space-y-2">
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard cut and style"
            />
          </div>

          <div className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border p-3">
            <div>
              <Label htmlFor="item-visible">Show to customers</Label>
              <p className="text-xs text-ink-muted">
                Hidden items stay in your list but nobody can request them.
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
              Cancel
            </Button>
            <Button
              className="flex-1"
              size="lg"
              onClick={() => save.mutate()}
              disabled={!name.trim() || save.isPending}
            >
              {save.isPending ? "Saving…" : item ? "Save changes" : "Add item"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
