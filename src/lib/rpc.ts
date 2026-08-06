"use client";

import { getClient } from "./supabase/client";
import type { Analytics, Item, Provider, Profile } from "./database.types";

/**
 * Typed wrappers over the RPC surface.
 *
 * Every request mutation goes through here. Clients hold no INSERT/UPDATE/
 * DELETE grant on `requests`, so there is no other way in - by design.
 *
 * Each wrapper throws the bare error code from Postgres; callers map it with
 * errorMessage().
 */

async function rpc<T>(fn: string, args: Record<string, unknown> = {}): Promise<T> {
  const { data, error } = await getClient().rpc(fn, args);
  if (error) throw new Error(error.message);
  return data as T;
}

/* ----------------------------------------------------------- requests ---- */

export interface RequestLine {
  item_id: string;
  quantity: number;
}

/**
 * @param idempotencyKey generated once per compose attempt and reused on retry,
 * so a double-tap or a flaky network cannot enqueue twice.
 */
export function createRequest(input: {
  providerId: string;
  items: RequestLine[];
  note?: string | null;
  idempotencyKey: string;
}) {
  return rpc("create_request", {
    p_provider_id: input.providerId,
    p_items: input.items,
    p_note: input.note ?? null,
    p_idempotency_key: input.idempotencyKey,
  });
}

export const startRequest = (id: string) => rpc("start_request", { p_request_id: id });
export const finishRequest = (id: string) => rpc("finish_request", { p_request_id: id });
export const cancelRequest = (id: string) => rpc("cancel_request", { p_request_id: id });

/** 'back' puts it at the end of the queue; 'original' keeps its old slot. */
export const restoreRequest = (id: string, mode: "back" | "original" = "back") =>
  rpc("restore_request", { p_request_id: id, p_mode: mode });

/* --------------------------------------------------- provider & items ---- */

export const myProvider = () => rpc<Provider | null>("my_provider");

export const upsertProvider = (p: Partial<Provider>) =>
  rpc<Provider>("upsert_provider", { p });

export const setProviderActive = (providerId: string, active: boolean) =>
  rpc<Provider>("set_provider_active", {
    p_provider_id: providerId,
    p_active: active,
  });

export const upsertItem = (p: Partial<Item> & { provider_id?: string }) =>
  rpc<Item>("upsert_item", { p });

export const setItemVisible = (itemId: string, visible: boolean) =>
  rpc<Item>("set_item_visible", { p_item_id: itemId, p_visible: visible });

export const reorderItems = (providerId: string, order: string[]) =>
  rpc<void>("reorder_items", { p_provider_id: providerId, p_order: order });

export const deleteItem = (itemId: string) =>
  rpc<void>("delete_item", { p_item_id: itemId });

/* ------------------------------------------------------------ profile ---- */

export const upsertProfile = (p: Partial<Profile>) =>
  rpc<Profile>("upsert_profile", { p });

/* ---------------------------------------------------------- analytics ---- */

export const providerAnalytics = (
  providerId: string,
  rangeStart?: string,
  rangeEnd?: string,
) =>
  rpc<Analytics>("provider_analytics", {
    p_provider_id: providerId,
    ...(rangeStart ? { p_range_start: rangeStart } : {}),
    ...(rangeEnd ? { p_range_end: rangeEnd } : {}),
  });
