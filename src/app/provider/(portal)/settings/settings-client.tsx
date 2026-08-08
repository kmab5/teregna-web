"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider, useProfile } from "@/lib/queries";
import { setProviderActive, upsertProfile, upsertProvider } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteAccount } from "@/components/teregna/delete-account";

export function SettingsClient() {
  const qc = useQueryClient();
  const { data: provider, isPending } = useMyProvider();
  const { data: profile } = useProfile();

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const active = useMutation({
    mutationFn: (value: boolean) => setProviderActive(provider!.id, value),
    onSuccess: (_d, value) => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast.success(value ? "You are open" : "You are closed", {
        description: value
          ? "Customers can find you and send requests."
          : "Nobody new can join. Everyone already queued is still there.",
      });
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  const saveProfile = useMutation({
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

  const save = useMutation({
    mutationFn: () =>
      upsertProvider({
        id: provider!.id,
        name: (name ?? provider!.name).trim(),
        description: description ?? provider!.description,
        location: location ?? provider!.location,
        category: category ?? provider!.category,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast.success("Saved");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  if (isPending || !provider) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">Settings</h1>
      </header>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Open for requests</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-6">
            <p className="text-sm text-ink-muted">
              Closing hides you from search and stops new requests. Your current
              queue is untouched, so you can finish the people already waiting.
            </p>
            <Switch
              checked={provider.is_active}
              onCheckedChange={(v) => active.mutate(v)}
              aria-label="Open for requests"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="p-name">Name</Label>
              <Input
                id="p-name"
                value={name ?? provider.name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-location">Location</Label>
              <Input
                id="p-location"
                value={location ?? provider.location ?? ""}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bole, Addis Ababa"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-desc">Description</Label>
              <Textarea
                id="p-desc"
                value={description ?? provider.description ?? ""}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-category">Category</Label>
              <Input
                id="p-category"
                value={category ?? provider.category ?? ""}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="barber"
              />
            </div>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Your details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-name">Your name</Label>
              <Input
                id="u-name"
                value={displayName ?? profile?.display_name ?? ""}
                onChange={(e) => setDisplayName(e.target.value)}
                autoComplete="name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="u-phone">Phone number</Label>
              <Input
                id="u-phone"
                type="tel"
                inputMode="tel"
                value={phone ?? profile?.phone ?? ""}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                className="font-mono"
              />
              <p className="text-xs text-ink-muted">
                Never shown publicly.
              </p>
            </div>
            <Button onClick={() => saveProfile.mutate()} disabled={saveProfile.isPending}>
              {saveProfile.isPending ? "Saving…" : "Save details"}
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
                Deleting your account closes your business and cancels anyone
                waiting. It cannot be undone.
              </p>
              <DeleteAccount isProvider />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
