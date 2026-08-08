"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider, useProfile } from "@/lib/queries";
import { upsertProfile } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DeleteAccount } from "@/components/teregna/delete-account";

export function AccountClient({ email }: { email: string }) {
  const qc = useQueryClient();
  const { data: profile, isPending } = useProfile();
  const { data: provider } = useMyProvider();

  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: () =>
      upsertProfile({
        display_name: (displayName ?? profile?.display_name ?? "").trim(),
        phone: (phone ?? profile?.phone ?? "").trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast.success("Saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isPending) return <Skeleton className="mt-6 h-64" />;

  return (
    <div className="mt-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={displayName ?? profile?.display_name ?? ""}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
            />
            <p className="text-xs text-ink-muted">
              Providers see this when you join their queue.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone number</Label>
            <Input
              id="phone"
              type="tel"
              inputMode="tel"
              value={phone ?? profile?.phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              className="font-mono"
            />
            <p className="text-xs text-ink-muted">Never shown publicly.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} readOnly disabled />
          </div>

          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline">Sign out</Button>
          </form>

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm text-ink-muted">
              {provider
                ? "Deleting your account also closes your business and cancels anyone waiting."
                : "Deleting your account cancels any request you have waiting."}{" "}
              It cannot be undone.
            </p>
            <DeleteAccount isProvider={Boolean(provider)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
