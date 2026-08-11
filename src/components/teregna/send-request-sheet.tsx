"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PackageX, Send } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ItemRow } from "./item-row";
import { createRequest } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT } from "@/i18n/client";
import { useLocaleFormat } from "@/lib/use-locale-format";
import type { ItemView } from "@/lib/database.types";

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
  items: ItemView[];
  signedIn: boolean;
}) {
  const t = useT();
  const { money } = useLocaleFormat();
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

  /**
   * Selected items the provider expects to run out of before this person's turn.
   * Surfaced as a heads-up, not a barrier: stock is the provider's own estimate,
   * people cancel, and providers restock.
   */
  const depleted = useMemo(
    () =>
      lines
        .map((l) => items.find((i) => i.id === l.item_id))
        .filter((i): i is ItemView => Boolean(i?.is_depleted)),
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
      toast.success(t("send.queuedTitle"), {
        description: t("send.queuedBody", { provider: providerName }),
        action: { label: t("send.view"), onClick: () => router.push("/requests") },
      });
      router.push("/requests");
    },
    onError: (error) => toast.error(t(errorKey(error) as never)),
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
        title={t("send.title", { provider: providerName })}
        description={t("send.subtitle")}
      >
        <div className="space-y-4">
          {items.length > 0 ? (
            <div className="space-y-2">
              <Label>{t("send.what")}</Label>
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
            <Label htmlFor="note">{t("send.note")}</Label>
            <Textarea
              id="note"
              value={note}
              maxLength={500}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("send.notePlaceholder")}
            />
          </div>

          {depleted.length > 0 ? (
            <div
              role="status"
              className="flex items-start gap-2.5 rounded-[var(--radius-sm)] bg-warning/10 p-3"
            >
              <PackageX className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
              <div className="text-sm">
                <p className="font-medium text-warning">{t("stock.warnTitle")}</p>
                <p className="mt-0.5 text-ink-muted">
                  {t("stock.warnBody", {
                    provider: providerName,
                    items: depleted.map((i) => i.name).join(", "),
                  })}
                </p>
              </div>
            </div>
          ) : null}

          {total > 0 ? (
            <div className="flex items-center justify-between rounded-[var(--radius-sm)] bg-muted px-3 py-2 text-sm">
              <span className="text-ink-muted">{t("send.estimated")}</span>
              <span className="font-mono tnum font-medium">{money(total)}</span>
            </div>
          ) : null}

          <Button
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? t("send.sending")
              : signedIn
                ? t("send.join")
                : t("send.joinSignedOut")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
