import { redirect } from "next/navigation";
import { SiteHeader } from "@/components/teregna/site-header";
import { ProviderNav } from "@/components/teregna/provider-nav";
import { getUser } from "@/lib/supabase/server";

export default async function ProviderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();
  if (!user) redirect("/provider/login");

  return (
    <>
      <SiteHeader signedIn />
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-[190px_1fr]">
          <ProviderNav />
          <main id="main" className="min-w-0">{children}</main>
        </div>
      </div>
    </>
  );
}
