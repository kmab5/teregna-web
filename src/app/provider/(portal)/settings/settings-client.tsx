"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useMyProvider } from "@/lib/queries";
import { setProviderActive, upsertProvider } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SettingsClient() {
  const qc = useQueryClient();
  const { data: provider, isPending } = useMyProvider();

  const [name, setName] = useState<string | null>(null);
  const [description, setDescription] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);

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

  const save = useMutation({
    mutationFn: () =>
      upsertProvider({
        id: provider!.id,
        name: (name ?? provider!.name).trim(),
        description: description ?? provider!.description,
        location: location ?? provider!.location,
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
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              {save.isPending ? "Saving…" : "Save changes"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form action="/auth/signout" method="post">
              <Button type="submit" variant="outline">Sign out</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
