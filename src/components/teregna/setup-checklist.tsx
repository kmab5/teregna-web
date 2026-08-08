"use client";

import Link from "next/link";
import { Check, CircleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Item, Profile, Provider } from "@/lib/database.types";

export interface SetupStep {
  id: string;
  label: string;
  done: boolean;
  href: string;
  cta: string;
}

/**
 * What still stands between this provider and being findable.
 *
 * Being live but unfindable is the worst state in the product: the provider
 * thinks they are open and nothing happens. So an incomplete setup is stated
 * plainly rather than left for them to discover from an empty queue.
 */
export function setupSteps(
  provider: Provider | null,
  items: Item[],
  profile: Profile | null,
): SetupStep[] {
  return [
    {
      id: "details",
      label: "Add your location and category",
      done: Boolean(provider?.location && provider?.category),
      href: "/provider/settings",
      cta: "Add details",
    },
    {
      id: "phone",
      label: "Add a phone number",
      done: Boolean(profile?.phone),
      href: "/provider/settings",
      cta: "Add phone",
    },
    {
      id: "items",
      label: "List at least one service",
      done: items.length > 0,
      href: "/provider/items",
      cta: "Add a service",
    },
    {
      id: "visible",
      label: "Make a service visible to customers",
      done: items.some((i) => i.is_visible),
      href: "/provider/items",
      cta: "Show a service",
    },
    {
      id: "open",
      label: "Open for requests",
      done: Boolean(provider?.is_active),
      href: "/provider/settings",
      cta: "Open up",
    },
  ];
}

export function SetupChecklist({ steps }: { steps: SetupStep[] }) {
  const remaining = steps.filter((s) => !s.done);
  if (remaining.length === 0) return null;

  const next = remaining[0];

  return (
    <section
      aria-labelledby="setup-heading"
      className="mb-6 rounded-[var(--radius-md)] border border-warning/40 bg-warning/5 p-5"
    >
      <div className="flex items-start gap-3">
        <CircleAlert className="mt-0.5 size-5 shrink-0 text-warning" aria-hidden />
        <div className="min-w-0 flex-1">
          <h2 id="setup-heading" className="font-display text-lg font-semibold">
            {remaining.length === steps.length
              ? "Customers cannot find you yet"
              : `${remaining.length} thing${remaining.length === 1 ? "" : "s"} left before customers can find you`}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Your queue stays empty until your listing is complete and at least
            one service is visible.
          </p>

          <ul className="mt-4 space-y-2">
            {steps.map((step) => (
              <li key={step.id} className="flex items-center gap-2.5 text-sm">
                <span
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border",
                    step.done
                      ? "border-accent bg-accent text-on-accent"
                      : "border-border bg-surface",
                  )}
                  aria-hidden
                >
                  {step.done ? <Check className="size-3" /> : null}
                </span>
                <span className={cn(step.done && "text-ink-muted line-through")}>
                  {step.label}
                </span>
                {step.done ? <span className="sr-only">done</span> : null}
              </li>
            ))}
          </ul>

          <Button asChild className="mt-4">
            <Link href={next.href}>{next.cta}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
