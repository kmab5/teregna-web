"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Package, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { useMyProvider, useProviderItems } from "@/lib/queries";
import { deleteItem, setItemVisible, upsertItem } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { EmptyState } from "@/components/teregna/empty-state";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { formatBirr } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Item } from "@/lib/database.types";

export function ItemsClient() {
  const qc = useQueryClient();
  const { data: provider } = useMyProvider();
  const { data, isPending } = useProviderItems(provider?.id ?? "");
  const [editing, setEditing] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const key = qk.providerItems(provider?.id ?? "");

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
      // Snapshots mean history survives the delete. Say so - it is reassuring.
      toast.success("Item removed", {
        description: "Past requests keep the name and price they were sent with.",
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-40" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}
      </div>
    );
  }

  const items = data ?? [];

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
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
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
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus aria-hidden /> Add your first item
            </Button>
          }
        />
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex items-center gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-4 elev-1",
                !item.is_visible && "opacity-60",
              )}
            >
              <div className="min-w-0 flex-1">
                <button
                  type="button"
                  onClick={() => { setEditing(item); setOpen(true); }}
                  className="text-left font-medium hover:text-primary"
                >
                  {item.name}
                </button>
                {item.description ? (
                  <p className="truncate text-sm text-ink-muted">{item.description}</p>
                ) : null}
              </div>

              <span className="font-mono tnum text-sm text-ink-muted">
                {formatBirr(item.price, item.currency)}
              </span>

              <div className="flex items-center gap-2">
                <Switch
                  checked={item.is_visible}
                  onCheckedChange={(v) => toggle.mutate({ id: item.id, visible: v })}
                  aria-label={`${item.is_visible ? "Hide" : "Show"} ${item.name}`}
                />
                {item.is_visible ? (
                  <Eye className="size-4 text-accent" aria-hidden />
                ) : (
                  <EyeOff className="size-4 text-ink-muted" aria-hidden />
                )}
              </div>

              <button
                type="button"
                onClick={() => remove.mutate(item.id)}
                aria-label={`Remove ${item.name}`}
                className="rounded-[var(--radius-sm)] p-2 text-ink-muted transition-colors hover:bg-muted hover:text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ItemSheet
        open={open}
        onOpenChange={setOpen}
        item={editing}
        providerId={provider?.id}
        onSaved={() => qc.invalidateQueries({ queryKey: key })}
      />
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
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");

  // Reset the form whenever the sheet opens on a different item.
  const [lastId, setLastId] = useState<string | null>(null);
  const currentId = item?.id ?? null;
  if (open && lastId !== currentId) {
    setLastId(currentId);
    setName(item?.name ?? "");
    setDescription(item?.description ?? "");
    setPrice(item?.price != null ? String(item.price) : "");
  }

  const save = useMutation({
    mutationFn: () =>
      upsertItem({
        ...(item ? { id: item.id } : { provider_id: providerId }),
        name: name.trim(),
        description: description.trim() || null,
        price: price ? Number(price) : null,
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
      <SheetTrigger asChild><span /></SheetTrigger>
      <SheetContent title={item ? "Edit item" : "Add an item"}>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">Name</Label>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Haircut"
            />
          </div>
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
            <Label htmlFor="item-desc">Description</Label>
            <Textarea
              id="item-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Standard cut and style"
            />
          </div>
          <Button
            className="w-full"
            size="lg"
            onClick={() => save.mutate()}
            disabled={!name.trim() || save.isPending}
          >
            {save.isPending ? "Saving…" : item ? "Save changes" : "Add item"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
