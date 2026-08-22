"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useProfile } from "@/lib/queries";
import { upsertProfile } from "@/lib/rpc";
import { errorKey } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { useT } from "@/i18n/client";

/** Permissive on purpose: local formats vary and a strict pattern rejects real numbers. */
const PHONE_RE = /^[+0-9][0-9\s-]{6,}$/;

/**
 * Collects a phone number from anyone signed in without one.
 *
 * The signup form requires it, but Google sign-in returns no phone and accounts
 * created before it was required have none. Without a number a provider finishes
 * the job and has no way to say so, which breaks the one thing the product is
 * for.
 *
 * Not dismissable: a "later" that never comes leaves the account permanently
 * unable to complete a transaction.
 */
export function PhoneGate() {
  const t = useT();
  const qc = useQueryClient();
  const { data: profile, isPending } = useProfile();
  const [phone, setPhone] = useState("");

  const save = useMutation({
    mutationFn: () => upsertProfile({ phone: phone.trim() }),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.profile() }),
  });

  /*
   * Sign-in is derived from the query rather than passed in: useProfile returns
   * null for a signed-out visitor, so `profile` being a row at all IS the signal.
   * That lets this mount once globally instead of being threaded through every
   * page header and the provider chrome separately.
   *
   * `isPending` matters - a profile mid-load must not flash the dialog at
   * someone who already has a number.
   */
  const needsPhone = !isPending && Boolean(profile) && !profile?.phone?.trim();

  if (!needsPhone) return null;

  return (
    <Sheet open onOpenChange={() => {}}>
      <SheetContent title={t("phone.gateTitle")} description={t("phone.gateBody")}>
        <div className="space-y-4">
          <span className="flex size-12 items-center justify-center rounded-full bg-muted">
            <Phone className="size-5 text-primary" aria-hidden />
          </span>

          <div className="space-y-2">
            <Label htmlFor="gate-phone">{t("auth.phone")}</Label>
            <Input
              id="gate-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              autoFocus
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+251 91 234 5678"
              className="font-mono"
            />
            {save.isError ? (
              <p role="alert" className="text-sm text-destructive">
                {t(errorKey(save.error) as never)}
              </p>
            ) : null}
          </div>

          <Button
            size="lg"
            className="w-full"
            disabled={save.isPending || !PHONE_RE.test(phone.trim())}
            onClick={() => save.mutate()}
          >
            {save.isPending ? t("common.saving") : t("phone.gateSave")}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
