"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemRow } from "./item-row";
import { createRequest } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { formatBirr } from "@/lib/format";
import type { Item } from "@/lib/database.types";

const PENDING_KEY = "teregna:pending-request";

interface PendingRequest {
  providerId: string;
  selected: Record<string, number>;
  note: string;
}

export function SendRequestSheet({
  providerId,
  providerName,
  items,
  signedIn,
}: {
  providerId: string;
  providerName: string;
  items: Item[];
  signedIn: boolean;
}) {
  const router = useRouter();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");

  // Generated once per compose attempt and reused on retry, so a double-tap or
  // a retry after a dropped connection cannot enqueue the same request twice.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  /**
   * Pick up where a guest left off.
   *
   * Choosing three services, being asked to sign in, and coming back to an
   * empty sheet is the fastest way to lose someone - and the Google round trip
   * makes that gap longer, not shorter. Selections are parked in
   * sessionStorage before we send them away, and reclaimed when they return.
   *
   * The disable below is deliberate. The rule guards against cascading
   * renders from state that should have been derived; this is a one-shot read
   * of an external handoff that only exists after a full page navigation, so
   * there is nothing to derive it from. Doing it during render instead would
   * mean mutating sessionStorage in the render phase, which is worse.
   */
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!signedIn) return;
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_KEY);

    try {
      const pending = JSON.parse(raw) as PendingRequest;
      if (pending.providerId !== providerId) return;
      setSelected(pending.selected ?? {});
      setNote(pending.note ?? "");
      setOpen(true);
    } catch {
      // A malformed entry is not worth surfacing; it is already cleared.
    }
  }, [signedIn, providerId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const lines = useMemo(
    () => Object.entries(selected).map(([item_id, quantity]) => ({ item_id, quantity })),
    [selected],
  );

  const total = useMemo(
    () =>
      lines.reduce((sum, l) => {
        const item = items.find((i) => i.id === l.item_id);
        return sum + (item?.price ?? 0) * l.quantity;
      }, 0),
    [lines, items],
  );

  const mutation = useMutation({
    mutationFn: () =>
      createRequest({
        providerId,
        items: lines,
        note: note.trim() || null,
        idempotencyKey,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myRequests() });
      qc.invalidateQueries({ queryKey: ["discovery"] });
      setOpen(false);
      setSelected({});
      setNote("");
      setIdempotencyKey(crypto.randomUUID());
      toast.success("You're in the queue", {
        description: `${providerName} can see your request.`,
        action: { label: "View", onClick: () => router.push("/requests") },
      });
      router.push("/requests");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });

  function toggle(id: string) {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[id]) delete next[id];
      else next[id] = 1;
      return next;
    });
  }

  /**
   * A guest keeps their selections through sign-in. Losing what someone just
   * picked because we asked them to log in is the fastest way to lose them.
   */
  function handleSubmit() {
    if (!signedIn) {
      const pending: PendingRequest = { providerId, selected, note };
      sessionStorage.setItem(PENDING_KEY, JSON.stringify(pending));
      router.push(`/login?next=${encodeURIComponent(`/p/${providerId}`)}`);
      return;
    }
    mutation.mutate();
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="lg" className="w-full sm:w-auto">
          <Send aria-hidden />
          Send request
        </Button>
      </SheetTrigger>

      <SheetContent
        title={`Request at ${providerName}`}
        description="Pick what you need. Everything here is optional except sending."
      >
        <div className="space-y-4">
          {items.length > 0 ? (
            <div className="space-y-2">
              <Label>What do you need?</Label>
              <div className="space-y-2">
                {items.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    selected={Boolean(selected[item.id])}
                    quantity={selected[item.id]}
                    onToggle={() => toggle(item.id)}
                    onQuantity={(n) =>
                      setSelected((p) => ({ ...p, [item.id]: n }))
                    }
                  />
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="note">Anything they should know?</Label>
            <Textarea
              id="note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder="In a bit of a hurry"
            />
          </div>

          {total > 0 ? (
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-sm">
              <span className="text-ink-muted">Estimated</span>
              <span className="font-mono tnum font-medium">{formatBirr(total)}</span>
            </div>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Sending…"
              : signedIn
                ? "Join the queue"
                : "Sign in and join the queue"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
