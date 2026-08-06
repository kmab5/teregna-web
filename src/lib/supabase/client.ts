"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. Uses the publishable anon key, which is public by design -
 * RLS is the real gate. The service-role key never reaches a browser.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}

let browserClient: ReturnType<typeof createBrowserClient> | undefined;

/** One client per tab, so the realtime socket and session are shared. */
export function getClient() {
  if (!browserClient) browserClient = createClient();
  return browserClient;
}
