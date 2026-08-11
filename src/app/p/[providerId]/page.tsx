import { notFound } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { SiteHeader } from "@/components/teregna/site-header";
import { SendRequestSheet } from "@/components/teregna/send-request-sheet";
import { ItemRow } from "@/components/teregna/item-row";
import { createClient, getUser } from "@/lib/supabase/server";
import { getT } from "@/i18n/server";
import type { ItemView, ProviderPublic } from "@/lib/database.types";

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
  const t = await getT();

  const [{ data: providerData }, { data: itemsData }] = await Promise.all([
    supabase.from("provider_public").select("*").eq("id", providerId).maybeSingle(),
    supabase
      .from("items_view")
      .select("*")
      .eq("provider_id", providerId)
      .order("display_order"),
  ]);

  const provider = providerData as ProviderPublic | null;
  if (!provider) notFound();

  const items = (itemsData ?? []) as ItemView[];

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main id="main" className="mx-auto max-w-3xl px-4 py-6 md:py-10">
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
              <span className="font-mono tnum">{provider.queue_length === 0 ? t("queue.none") : t.plural("queue.waiting", provider.queue_length)}</span>
            </span>
          </div>

          {provider.description ? (
            <p className="mt-4 text-ink-muted">{provider.description}</p>
          ) : null}
        </header>

        {items.length > 0 ? (
          <section className="py-6">
            <h2 className="font-display text-xl font-semibold">{t("prov.offers")}</h2>
            <div className="mt-4 space-y-2">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </div>
          </section>
        ) : (
          <p className="py-6 text-ink-muted">
            {t("prov.noItems")}
          </p>
        )}

        <div className="sticky bottom-14 -mx-4 border-t border-border bg-bg/95 px-4 py-4 backdrop-blur md:bottom-0 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:pb-10">
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
