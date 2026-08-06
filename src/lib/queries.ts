"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { getClient } from "./supabase/client";
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
  });

  useEffect(() => {
    if (!providerId) return;
    const client = getClient();
    const channel = client
      .channel(`queue:${providerId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `provider_id=eq.${providerId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: qk.queue(providerId) });
          qc.invalidateQueries({ queryKey: qk.archive(providerId) });
        },
      )
      .subscribe();

    // Liveness is not truth: on reconnect, re-read before trusting the socket.
    const onOnline = () =>
      qc.invalidateQueries({ queryKey: qk.queue(providerId) });
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      client.removeChannel(channel);
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
  });

  useEffect(() => {
    if (!userId) return;
    const client = getClient();
    const channel = client
      .channel(`my-requests:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "requests",
          filter: `receiver_id=eq.${userId}`,
        },
        () => qc.invalidateQueries({ queryKey: qk.myRequests() }),
      )
      .subscribe();

    const onOnline = () => qc.invalidateQueries({ queryKey: qk.myRequests() });
    window.addEventListener("online", onOnline);

    return () => {
      window.removeEventListener("online", onOnline);
      client.removeChannel(channel);
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
