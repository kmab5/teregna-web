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
import { errorMessage } from "@/lib/errors";

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
      toast.success("Your account is gone", {
        description:
          result.cancelled_requests > 0
            ? `${result.cancelled_requests} open request${result.cancelled_requests === 1 ? "" : "s"} were cancelled.`
            : undefined,
      });
      router.push("/");
      router.refresh();
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="destructive">Delete my account</Button>
      </SheetTrigger>

      <SheetContent title="Delete your account">
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-[var(--radius-sm)] bg-destructive/10 p-3">
            <TriangleAlert
              className="mt-0.5 size-5 shrink-0 text-destructive"
              aria-hidden
            />
            <p className="text-sm text-destructive">
              This cannot be undone.
            </p>
          </div>

          <div className="space-y-2 text-sm text-ink-muted">
            <p>What happens:</p>
            <ul className="list-disc space-y-1 pl-5">
              <li>Your name, phone number and photo are erased.</li>
              <li>Any request you have waiting right now is cancelled.</li>
              {isProvider ? (
                <>
                  <li>Your business closes and disappears from search.</li>
                  <li>
                    Anyone queued with you right now is cancelled and told.
                  </li>
                  <li>
                    Past requests stay in your customers&rsquo; own history,
                    listed under a deleted account. Those records are theirs as
                    well as yours, so they are not ours to erase.
                  </li>
                </>
              ) : (
                <li>
                  Past requests stay in the provider&rsquo;s records, listed
                  under a deleted account.
                </li>
              )}
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">
              Type <span className="font-mono font-semibold">{CONFIRM}</span> to
              confirm
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
              Keep my account
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => remove.mutate()}
              disabled={typed !== CONFIRM || remove.isPending}
            >
              {remove.isPending ? "Deleting…" : "Delete forever"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
