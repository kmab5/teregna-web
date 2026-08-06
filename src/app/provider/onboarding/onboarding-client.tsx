"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { setProviderActive, upsertItem, upsertProvider } from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES = ["barber", "tailor", "clinic", "laundry", "repair", "other"];

/**
 * Three fields and one item, then you are live. Activation is the metric this
 * screen exists to serve, so everything optional was cut.
 */
export function OnboardingClient() {
  const router = useRouter();
  const qc = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("barber");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const create = useMutation({
    mutationFn: async () => {
      const provider = await upsertProvider({
        name: name.trim(),
        category,
        location: location.trim() || null,
        description: description.trim() || null,
      });
      if (itemName.trim()) {
        await upsertItem({
          provider_id: provider.id,
          name: itemName.trim(),
          price: itemPrice ? Number(itemPrice) : null,
        });
      }
      await setProviderActive(provider.id, true);
      return provider;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      toast.success("You are live", {
        description: "Customers can find you and join your queue.",
      });
      router.push("/provider");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="font-display text-2xl font-semibold">Set up your queue</h1>
      <p className="mt-1 text-ink-muted">
        Two minutes. You can change any of this later.
      </p>

      <div className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name">What is your business called?</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Abebe Barbershop"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">What do you do?</Label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-11 w-full rounded-[var(--radius-sm)] border border-border bg-surface px-3 capitalize text-ink"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c} className="capitalize">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Where are you?</Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Bole, Addis Ababa"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Anything customers should know?</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Classic cuts and hot-towel shaves. Walk-ins welcome."
          />
        </div>

        <div className="rounded-[var(--radius-md)] border border-border bg-surface-2 p-4">
          <p className="mb-3 text-sm font-medium">
            Add one thing you offer
            <span className="ml-2 font-normal text-ink-muted">optional</span>
          </p>
          <div className="flex gap-2">
            <Input
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="Haircut"
              aria-label="Item name"
            />
            <Input
              type="number"
              min={0}
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
              placeholder="150"
              aria-label="Price in birr"
              className="w-28 font-mono"
            />
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => create.mutate()}
          disabled={!name.trim() || create.isPending}
        >
          {create.isPending ? "Setting up…" : "Open my queue"}
        </Button>
      </div>
    </div>
  );
}
