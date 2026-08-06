import { notFound } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/teregna/site-header";
import { SendRequestSheet } from "@/components/teregna/send-request-sheet";
import { ItemRow } from "@/components/teregna/item-row";
import { createClient, getUser } from "@/lib/supabase/server";
import { queueLabel } from "@/lib/format";
import type { Item, ProviderPublic } from "@/lib/database.types";

/**
 * Server-rendered so it is fast on a mid-range phone and shareable as a link.
 * Reads only what the public contract exposes: an active provider and its
 * visible items. Hidden items are filtered by RLS, not by this query.
 */
export default async function ProviderPage({
  params,
}: {
  params: Promise<{ providerId: string }>;
}) {
  const { providerId } = await params;
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: providerData }, { data: itemsData }] = await Promise.all([
    supabase.from("provider_public").select("*").eq("id", providerId).maybeSingle(),
    supabase
      .from("items")
      .select("*")
      .eq("provider_id", providerId)
      .order("display_order"),
  ]);

  const provider = providerData as ProviderPublic | null;
  if (!provider) notFound();

  const items = (itemsData ?? []) as Item[];

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main id="main" className="mx-auto max-w-3xl px-4 py-10">
        <header className="border-b border-border pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-semibold">{provider.name}</h1>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-muted">
                {provider.category ? (
                  <span className="rounded-full bg-muted px-2.5 py-0.5 capitalize">
                    {provider.category}
                  </span>
                ) : null}
                {provider.location ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="size-3.5" aria-hidden />
                    {provider.location}
                  </span>
                ) : null}
              </div>
            </div>

            {/* A count, never who is in it. */}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary">
              <Users className="size-4" aria-hidden />
              <span className="font-mono tnum">{queueLabel(provider.queue_length)}</span>
            </span>
          </div>

          {provider.description ? (
            <p className="mt-4 text-ink-muted">{provider.description}</p>
          ) : null}
        </header>

        {items.length > 0 ? (
          <section className="py-6">
            <h2 className="font-display text-xl font-semibold">What they offer</h2>
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : (
          <p className="py-6 text-ink-muted">
            This provider has not listed anything yet. You can still send a
            request with a note.
          </p>
        )}

        <div className="sticky bottom-0 -mx-4 border-t border-border bg-bg/90 px-4 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:pb-10">
          <SendRequestSheet
            providerId={provider.id}
            providerName={provider.name}
            items={items}
            signedIn={Boolean(user)}
          />
        </div>
      </main>
    </>
  );
}
