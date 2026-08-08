import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/teregna/site-header";
import { getUser } from "@/lib/supabase/server";
import { AccountClient } from "./account-client";

export const metadata = { title: "Your account — Teregna" };

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  return (
    <>
      <SiteHeader signedIn />
      <main id="main" className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="font-display text-2xl font-semibold">Your account</h1>
        <AccountClient email={user.email ?? ""} />
      </main>
    </>
  );
}
