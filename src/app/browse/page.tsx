import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";
import { BrowseClient } from "./browse-client";

export const metadata = { title: "Browse providers — Teregna" };

export default async function BrowsePage() {
  const user = await getUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="main" className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Find a provider</h1>
        <p className="mt-1 text-ink-muted">
          Browse without an account. You only sign in when you send a request.
        </p>
        <BrowseClient />
      </main>
    </>
  );
}
