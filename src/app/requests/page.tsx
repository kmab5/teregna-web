import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";
import { MyRequestsClient } from "./my-requests-client";

export const metadata = { title: "My requests — Teregna" };

export default async function RequestsPage() {
  const user = await getUser();
  return (
    <>
      <SiteHeader signedIn={Boolean(user)} />
      <main id="main" className="mx-auto max-w-3xl px-4 py-6 pb-24 md:py-10 md:pb-10">
        <h1 className="font-display text-2xl font-semibold">My requests</h1>
        <p className="mt-1 text-ink-muted">
          Your place updates on its own. No need to refresh.
        </p>
        <MyRequestsClient userId={user?.id} />
      </main>
    </>
  );
}
