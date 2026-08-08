"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getClient } from "./supabase/client";
import { subscribeToRequests } from "./realtime";
import { qk } from "./query-keys";
import * as rpc from "./rpc";
import type {
  ArchiveRow,
  Item,
  MyRequest,
  Profile,
  Provider,
  ProviderPublic,
  QueueRow,
} from "./database.types";

/* =============================================================== reads === */

export function useDiscovery(search: string, category: string | null) {
  return useQuery({
    queryKey: qk.discovery(search, category),
    queryFn: async (): Promise<ProviderPublic[]> => {
      let q = getClient().from("provider_public").select("*").order("name");
      if (search.trim()) q = q.ilike("name", `%${search.trim()}%`);
      if (category) q = q.eq("category", category);
      const { data, error } = await q.limit(60);
      if (error) throw error;
      return (data ?? []) as ProviderPublic[];
    },
    staleTime: 15_000,
  });
}

/**
 * The categories that actually exist, read from the live providers.
 *
 * These were previously a hardcoded guess (barber, tailor, clinic, laundry,
 * repair), which meant the filters offered categories nobody used and hid ones
 * that did exist. Category is free text - providers type their own during
 * onboarding and can edit it in settings - so the only correct source is the
 * data.
 */
export function useCategories() {
  return useQuery({
    queryKey: qk.categories(),
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await getClient()
        .from("provider_public")
        .select("category")
        .not("category", "is", null);
      if (error) throw error;

      // Case-insensitive dedupe, keeping the first spelling a provider used.
      const seen = new Map<string, string>();
      for (const row of (data ?? []) as { category: string | null }[]) {
        const value = row.category?.trim();
        if (!value) continue;
        const key = value.toLowerCase();
        if (!seen.has(key)) seen.set(key, value);
      }
      return [...seen.values()].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      );
    },
    staleTime: 5 * 60_000,
  });
}

export function useProviderItems(providerId: string) {
  return useQuery({
    queryKey: qk.providerItems(providerId),
    queryFn: async (): Promise<Item[]> => {
      const { data, error } = await getClient()
        .from("items")
        .select("*")
        .eq("provider_id", providerId)
        .order("display_order");
      if (error) throw error;
      return (data ?? []) as Item[];
    },
  });
}

export function useMyProvider() {
  return useQuery({
    queryKey: qk.myProvider(),
    queryFn: async () => (await rpc.myProvider()) as Provider | null,
    staleTime: 30_000,
  });
}

export function useProfile() {
  return useQuery({
    queryKey: qk.profile(),
    queryFn: async (): Promise<Profile | null> => {
      const client = getClient();
      const { data: auth } = await client.auth.getUser();
      if (!auth.user) return null;
      const { data, error } = await client
        .from("profiles")
        .select("*")
        .eq("id", auth.user.id)
        .single();
      if (error) throw error;
      return data as Profile;
    },
  });
}

/**
 * The provider's live queue.
 *
 * Realtime tells us *that* something changed; it never tells us the new order.
 * `position` is derived server-side from `seq`, so on any event we refetch the
 * view rather than trying to recompute locally and drift.
 */
export function useProviderQueue(providerId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.queue(providerId ?? ""),
    enabled: Boolean(providerId),
    queryFn: async (): Promise<QueueRow[]> => {
      const { data, error } = await getClient()
        .from("provider_queue")
        .select("*")
        .order("position");
      if (error) throw error;
      return (data ?? []) as QueueRow[];
    },
    // A stale queue is worse than a slow one.
    refetchOnWindowFocus: true,
    // Safety net. Realtime is the fast path, but it depends on the socket
    // staying authenticated and the table staying in the publication - both
    // outside this app's control. A quiet poll means the worst case is a few
    // seconds late rather than silently frozen.
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!providerId) return;
    const client = getClient();
    let channel: Awaited<ReturnType<typeof subscribeToRequests>> = null;
    let cancelled = false;

    subscribeToRequests({
      name: `queue:${providerId}`,
      filter: `provider_id=eq.${providerId}`,
      onChange: () => {
        qc.invalidateQueries({ queryKey: qk.queue(providerId) });
        qc.invalidateQueries({ queryKey: qk.archive(providerId) });
      },
    }).then((ch) => {
      if (cancelled && ch) client.removeChannel(ch);
      else channel = ch;
    });

    // Liveness is not truth: on reconnect, re-read before trusting the socket.
    const onOnline = () =>
      qc.invalidateQueries({ queryKey: qk.queue(providerId) });
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      if (channel) client.removeChannel(channel);
    };
  }, [providerId, qc]);

  return query;
}

export function useProviderArchive(providerId: string | undefined) {
  return useQuery({
    queryKey: qk.archive(providerId ?? ""),
    enabled: Boolean(providerId),
    queryFn: async (): Promise<ArchiveRow[]> => {
      const { data, error } = await getClient()
        .from("provider_archive")
        .select("*")
        .order("archived_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data ?? []) as ArchiveRow[];
    },
  });
}

/** The receiver's own requests, live. Position updates as the queue moves. */
export function useMyRequests(userId: string | undefined) {
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: qk.myRequests(),
    queryFn: async (): Promise<MyRequest[]> => {
      const { data, error } = await getClient()
        .from("my_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MyRequest[];
    },
    refetchOnWindowFocus: true,
    // See the note in useProviderQueue.
    refetchInterval: 20_000,
    refetchIntervalInBackground: false,
  });

  useEffect(() => {
    if (!userId) return;
    const client = getClient();
    let channel: Awaited<ReturnType<typeof subscribeToRequests>> = null;
    let cancelled = false;

    subscribeToRequests({
      name: `my-requests:${userId}`,
      filter: `receiver_id=eq.${userId}`,
      onChange: () => qc.invalidateQueries({ queryKey: qk.myRequests() }),
    }).then((ch) => {
      if (cancelled && ch) client.removeChannel(ch);
      else channel = ch;
    });

    const onOnline = () => qc.invalidateQueries({ queryKey: qk.myRequests() });
    window.addEventListener("online", onOnline);

    return () => {
      cancelled = true;
      window.removeEventListener("online", onOnline);
      if (channel) client.removeChannel(channel);
    };
  }, [userId, qc]);

  return query;
}

export function useAnalytics(providerId: string | undefined, days: number) {
  return useQuery({
    queryKey: qk.analytics(providerId ?? "", days),
    enabled: Boolean(providerId),
    queryFn: () => {
      const end = new Date();
      const start = new Date(end.getTime() - days * 86_400_000);
      return rpc.providerAnalytics(providerId!, start.toISOString(), end.toISOString());
    },
    staleTime: 60_000,
  });
}
