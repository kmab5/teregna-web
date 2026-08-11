"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { TriangleAlert } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getClient } from "@/lib/supabase/client";
import { deleteMyAccount } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey } from "@/lib/errors";

const CONFIRM = "DELETE";

/**
 * Account deletion.
 *
 * Typing the confirmation word is deliberate friction: this cannot be undone
 * and it cancels anything the person currently has queued. The copy says
 * exactly what survives and why, because "your data will be deleted" is not
 * true here - the other party's history is not the deleter's to erase.
 */
export function DeleteAccount({ isProvider }: { isProvider: boolean }) {
  const t = useT();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");

  const remove = useMutation({
    mutationFn: async () => {
      const result = await deleteMyAccount();
      await getClient().auth.signOut();
      return result;
    },
    onSuccess: (result) => {
      toast.success(t("acct.deletedTitle"), {
        description:
          result.cancelled_requests > 0
            ? t.plural("acct.deletedBody", result.cancelled_requests)
            : undefined,
      });
      router.push("/");
      router.refresh();
    },
    onError: (e) => toast.error(t(errorKey(e) as never)),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="destructive">{t("acct.delete")}</Button>
      </SheetTrigger>

      <SheetContent title={t("acct.deleteTitle")}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-destructive/10 p-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden
            />
            <p className="text-sm text-destructive">
              {t("acct.irreversible")}
            </p>
          </div>

          <div className="space-y-2 text-sm text-ink-muted">
            <p>{t("acct.whatHappens")}</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>{t("acct.scrub")}</li>
              <li>{t("acct.cancels")}</li>
              {isProvider ? (
                <>
                  <li>{t("acct.shopCloses")}</li>
                  <li>{t("acct.queueTold")}</li>
                  <li>{t("acct.histProvider")}</li>
                </>
              ) : (
                <li>{t("acct.histReceiver")}</li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              {t("acct.confirmLabel", { word: CONFIRM })}
            </Label>
            <Input
              id="confirm"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              {t("acct.keep")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => remove.mutate()}
              disabled={typed !== CONFIRM || remove.isPending}
            >
              {remove.isPending ? t("acct.deleting") : t("acct.forever")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
