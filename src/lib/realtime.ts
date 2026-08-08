"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { getClient } from "./supabase/client";

/**
 * Subscribing to `requests` with RLS in force requires the socket to carry the
 * user's JWT. The browser client loads its session from cookies
 * asynchronously, so a channel opened during the first render can connect
 * before the session exists - it then subscribes as `anon`, RLS filters every
 * event, and the feed looks alive while delivering nothing. That is the failure
 * mode this exists to prevent: it waits for a session, sets the socket auth
 * explicitly, and only then subscribes.
 */
export async function subscribeToRequests(options: {
  name: string;
  filter: string;
  onChange: () => void;
  onStatus?: (status: string) => void;
}): Promise<RealtimeChannel | null> {
  const supabase = getClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) return null;

  // Hand the socket a token before it opens. Without this the connection can
  // race the session and come up unauthenticated.
  await supabase.realtime.setAuth(session.access_token);

  const channel = supabase
    .channel(options.name)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "requests",
        filter: options.filter,
      },
      () => options.onChange(),
    )
    .subscribe((status: string) => {
      options.onStatus?.(status);
      if (process.env.NODE_ENV === "development") {
        console.debug(`[realtime] ${options.name}: ${status}`);
      }
    });

  return channel;
}
