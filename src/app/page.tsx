import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Mark } from "@/components/teregna/logo";
import { Button } from "@/components/ui/button";
import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { ProviderCard } from "@/components/teregna/provider-card";
import type { ProviderPublic } from "@/lib/database.types";

export default async function LandingPage() {
  const user = await getUser();
  const supabase = await createClient();
  const { data } = await supabase
    .from("provider_public")
    .select("*")
    .order("queue_length", { ascending: false })
    .limit(3);
  const featured = (data ?? []) as ProviderPublic[];

  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />

      <main id="main">
        {/* The hero is the thesis: a queue, counting down. */}
        <section className="mx-auto max-w-6xl px-4 py-10 sm:py-24">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-ink-muted">
                <Mark className="h-3.5 w-7 text-primary" />
                <span lang="am" className="am">ተረኛ</span>
                <span>— the one whose turn it is</span>
              </p>

              <h1 className="font-display text-3xl font-semibold leading-[1.1] sm:text-5xl">
                Stop asking
                <br />
                <span className="text-primary">“am I next?”</span>
              </h1>

              <p className="mt-4 text-base text-ink-muted sm:mt-5 sm:text-lg">
                Find a barber, a tailor, a clinic. Send a request and take your
                place in their queue. Watch your position move without standing
                in a line or calling ahead.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/browse">
                    Find a provider <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="/provider/login">Run a queue</Link>
                </Button>
              </div>
            </div>

            {/* Signature: the rail. Position numbers as a literal column. */}
            <div className="queue-rail relative space-y-3 rounded-[var(--radius-lg)] border border-border bg-surface p-4 elev-2 sm:p-6">
              <p className="mb-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
                Abebe Barbershop · live
              </p>
              {[
                { n: 1, name: "Sara G.", state: "In progress", active: true },
                { n: 2, name: "Dawit A.", state: "Queued" },
                { n: 3, name: "Meron T.", state: "Queued" },
                { n: 4, name: "You", state: "Queued", you: true },
              ].map((r) => (
                <div key={r.n} className="relative flex items-center gap-4">
                  <div
                    className={
                      r.active
                        ? "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-primary font-mono tnum font-semibold text-on-primary"
                        : r.you
                          ? "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-primary bg-surface font-mono tnum font-semibold text-primary"
                          : "z-10 flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-border bg-surface font-mono tnum font-semibold"
                    }
                  >
                    {r.n}
                  </div>
                  <div className="min-w-0">
                    <p className={r.you ? "font-medium text-primary" : "font-medium"}>
                      {r.name}
                    </p>
                    <p className="text-sm text-ink-muted">{r.state}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {featured.length > 0 ? (
          <section className="mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
            <div className="mb-5 flex items-end justify-between">
              <h2 className="font-display text-xl font-semibold">Open now</h2>
              <Link
                href="/browse"
                className="text-sm font-medium text-primary hover:underline"
              >
                See all
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((p) => (
                <ProviderCard key={p.id} provider={p} />
              ))}
            </div>
          </section>
        ) : null}
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-ink-muted">
          Teregna · <span lang="am" className="am">ተረኛ</span> · Addis Ababa
        </div>
      </footer>
    </>
  );
}
