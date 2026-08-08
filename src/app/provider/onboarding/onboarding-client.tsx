"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Trash2 } from "lucide-react";
import {
  setProviderActive,
  upsertItem,
  upsertProfile,
  upsertProvider,
} from "@/lib/rpc";
import { errorMessage } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "barber", "salon", "tailor", "clinic", "dentist",
  "laundry", "repair", "mechanic", "other",
] as const;

interface Draft {
  name: string;
  category: string;
  location: string;
  description: string;
  displayName: string;
  phone: string;
  items: { name: string; price: string; duration: string }[];
}

const STEPS = ["Business", "Contact", "Services"] as const;

/**
 * Required onboarding.
 *
 * A provider who is live but has no location, no category and no phone number
 * is worse off than one who never signed up: they are waiting for a queue that
 * can never fill, and receivers who do find them cannot tell what they offer.
 * So the essentials are gated per step rather than collected optionally and
 * silently skipped.
 *
 * Services stay optional at this stage - some providers genuinely do one thing
 * and price it in person - but the step makes the cost of skipping explicit
 * rather than letting them walk past it.
 */
export function OnboardingClient() {
  const router = useRouter();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const [draft, setDraft] = useState<Draft>({
    name: "",
    category: "",
    location: "",
    description: "",
    displayName: "",
    phone: "",
    items: [{ name: "", price: "", duration: "" }],
  });

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // Each step states its own requirements, so Continue is never a dead button
  // with an unexplained disabled state.
  const missing: string[] =
    step === 0
      ? [
          !draft.name.trim() && "a business name",
          !draft.category && "a category",
          !draft.location.trim() && "a location",
        ].filter(Boolean) as string[]
      : step === 1
        ? [
            !draft.displayName.trim() && "your name",
            !/^[+0-9][0-9\s-]{6,}$/.test(draft.phone.trim()) && "a valid phone number",
          ].filter(Boolean) as string[]
        : [];

  const filledItems = draft.items.filter((i) => i.name.trim());

  const finish = useMutation({
    mutationFn: async () => {
      await upsertProfile({
        display_name: draft.displayName.trim(),
        phone: draft.phone.trim(),
      });

      const provider = await upsertProvider({
        name: draft.name.trim(),
        category: draft.category,
        location: draft.location.trim(),
        description: draft.description.trim() || null,
      });

      for (const item of filledItems) {
        await upsertItem({
          provider_id: provider.id,
          name: item.name.trim(),
          price: item.price ? Number(item.price) : null,
          duration_minutes: item.duration ? Number(item.duration) : null,
        });
      }

      // Only open the doors once there is something to show.
      if (filledItems.length > 0) {
        await setProviderActive(provider.id, true);
      }
      return provider;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myProvider() });
      qc.invalidateQueries({ queryKey: qk.profile() });
      toast.success(
        filledItems.length > 0 ? "You are live" : "Business created",
        {
          description:
            filledItems.length > 0
              ? "Customers can find you and join your queue."
              : "Add a service when you are ready and we will open you up.",
        },
      );
      router.push("/provider");
    },
    onError: (e) => toast.error(errorMessage(e)),
  });

  return (
    <div className="mx-auto max-w-lg">
      <ol className="mb-8 flex items-center gap-2" aria-label="Progress">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-1 items-center gap-2">
            <span
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold",
                i < step
                  ? "border-accent bg-accent text-on-accent"
                  : i === step
                    ? "border-primary bg-primary text-on-primary"
                    : "border-border text-ink-muted",
              )}
              aria-current={i === step ? "step" : undefined}
            >
              {i < step ? <Check className="size-3.5" aria-hidden /> : i + 1}
            </span>
            <span
              className={cn(
                "text-sm font-medium",
                i === step ? "text-ink" : "text-ink-muted",
              )}
            >
              {label}
            </span>
            {i < STEPS.length - 1 ? (
              <span className="h-px flex-1 bg-border" aria-hidden />
            ) : null}
          </li>
        ))}
      </ol>

      {step === 0 ? (
        <section>
          <h1 className="font-display text-2xl font-semibold">
            Tell us about your business
          </h1>
          <p className="mt-1 text-ink-muted">
            This is what customers see when they find you.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Business name</Label>
              <Input
                id="name"
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Abebe Barbershop"
                autoComplete="organization"
              />
            </div>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">What do you do?</legend>
              <div className="flex flex-wrap gap-2 pt-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => set("category", c)}
                    aria-pressed={draft.category === c}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                      draft.category === c
                        ? "bg-primary text-on-primary"
                        : "bg-muted text-ink-muted hover:text-ink",
                    )}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="space-y-2">
              <Label htmlFor="location">Where are you?</Label>
              <Input
                id="location"
                value={draft.location}
                onChange={(e) => set("location", e.target.value)}
                placeholder="Bole, Addis Ababa"
              />
              <p className="text-xs text-ink-muted">
                Customers filter by area, so be specific enough to be found.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">
                Anything else customers should know?
                <span className="ml-2 font-normal text-ink-muted">optional</span>
              </Label>
              <Textarea
                id="description"
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Classic cuts and hot-towel shaves. Walk-ins welcome."
              />
            </div>
          </div>
        </section>
      ) : null}

      {step === 1 ? (
        <section>
          <h1 className="font-display text-2xl font-semibold">How to reach you</h1>
          <p className="mt-1 text-ink-muted">
            Your phone number is not shown publicly. It is how we reach you about
            your account.
          </p>

          <div className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="displayName">Your name</Label>
              <Input
                id="displayName"
                value={draft.displayName}
                onChange={(e) => set("displayName", e.target.value)}
                placeholder="Abebe Kebede"
                autoComplete="name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone number</Label>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
                placeholder="+251 91 234 5678"
                autoComplete="tel"
                className="font-mono"
              />
            </div>
          </div>
        </section>
      ) : null}

      {step === 2 ? (
        <section>
          <h1 className="font-display text-2xl font-semibold">
            What do you offer?
          </h1>
          <p className="mt-1 text-ink-muted">
            Customers pick from this list when they send a request. You can
            change it any time.
          </p>

          <div className="mt-6 space-y-3">
            {draft.items.map((item, i) => (
              <div
                key={i}
                className="rounded-[var(--radius-md)] border border-border bg-surface p-3"
              >
                <div className="flex gap-2">
                  <Input
                    value={item.name}
                    onChange={(e) => {
                      const next = [...draft.items];
                      next[i] = { ...next[i], name: e.target.value };
                      set("items", next);
                    }}
                    placeholder="Haircut"
                    aria-label={`Service ${i + 1} name`}
                  />
                  {draft.items.length > 1 ? (
                    <button
                      type="button"
                      onClick={() =>
                        set("items", draft.items.filter((_, j) => j !== i))
                      }
                      aria-label={`Remove service ${i + 1}`}
                      className="shrink-0 rounded-[var(--radius-sm)] px-2 text-ink-muted hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden />
                    </button>
                  ) : null}
                </div>

                <div className="mt-2 flex gap-2">
                  <Input
                    type="number"
                    min={0}
                    value={item.price}
                    onChange={(e) => {
                      const next = [...draft.items];
                      next[i] = { ...next[i], price: e.target.value };
                      set("items", next);
                    }}
                    placeholder="Price (ETB)"
                    aria-label={`Service ${i + 1} price`}
                    className="font-mono"
                  />
                  <Input
                    type="number"
                    min={1}
                    value={item.duration}
                    onChange={(e) => {
                      const next = [...draft.items];
                      next[i] = { ...next[i], duration: e.target.value };
                      set("items", next);
                    }}
                    placeholder="Minutes"
                    aria-label={`Service ${i + 1} typical minutes`}
                    className="font-mono"
                  />
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={() =>
                set("items", [...draft.items, { name: "", price: "", duration: "" }])
              }
            >
              <Plus aria-hidden />
              Add another
            </Button>

            <p className="text-xs text-ink-muted">
              Minutes are optional and never shown to customers yet. They will be
              used to estimate waiting times in a future update.
            </p>

            {filledItems.length === 0 ? (
              <p className="rounded-[var(--radius-sm)] bg-warning/10 px-3 py-2 text-sm text-warning">
                You can skip this, but your business stays closed until at least
                one service is listed — customers will not be able to find you.
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {missing.length > 0 ? (
        <p className="mt-6 text-sm text-ink-muted" role="status">
          Still needed: {missing.join(", ")}.
        </p>
      ) : null}

      <div className="mt-6 flex gap-3">
        {step > 0 ? (
          <Button variant="outline" size="lg" onClick={() => setStep(step - 1)}>
            <ArrowLeft aria-hidden />
            Back
          </Button>
        ) : null}

        {step < STEPS.length - 1 ? (
          <Button
            size="lg"
            className="flex-1"
            onClick={() => setStep(step + 1)}
            disabled={missing.length > 0}
          >
            Continue
            <ArrowRight aria-hidden />
          </Button>
        ) : (
          <Button
            size="lg"
            className="flex-1"
            onClick={() => finish.mutate()}
            disabled={finish.isPending}
          >
            {finish.isPending
              ? "Setting up…"
              : filledItems.length > 0
                ? "Open my queue"
                : "Finish for now"}
          </Button>
        )}
      </div>
    </div>
  );
}
