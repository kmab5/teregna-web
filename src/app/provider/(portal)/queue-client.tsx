"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CheckCheck } from "lucide-react";
import { useMyProvider, useProviderItems, useProviderQueue, useProfile } from "@/lib/queries";
import { SetupChecklist, setupSteps } from "@/components/teregna/setup-checklist";
import { useNow } from "@/lib/use-now";
import { finishRequest, startRequest } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey, isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { QueueRow } from "@/components/teregna/queue-row";
import { EmptyState } from "@/components/teregna/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import type { QueueRow as QueueRowData } from "@/lib/database.types";

export function QueueClient() {
  const t = useT();
  const qc = useQueryClient();
  const { data: provider, isPending: providerPending } = useMyProvider();
  const { data: queue, isPending } = useProviderQueue(provider?.id);
  const { data: items } = useProviderItems(provider?.id ?? "");
  const { data: profile } = useProfile();
  // One clock for the whole list, so every wait time ticks in step.
  const now = useNow();

  const key = qk.queue(provider?.id ?? "");

  /**
   * Optimistic, because the provider is standing in front of a customer and a
   * spinner is not an acceptable answer. Reconciled against the RPC result:
   * if the receiver cancelled a half-second earlier, the row comes back and we
   * say why.
   */
  const finish = useMutation({
    mutationFn: (id: string) => finishRequest(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<QueueRowData[]>(key);
      qc.setQueryData<QueueRowData[]>(key, (old) =>
        (old ?? []).filter((r) => r.id !== id),
      );
      return { previous };
    },
    onError: (error, _id, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
      if (isRace(error)) qc.invalidateQueries({ queryKey: key });
      toast.error(t(errorKey(error) as never));
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.archive(provider!.id) });
      toast.success(t("pq.finishedTitle"), { description: t("pq.finishedBody") });
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  const start = useMutation({
    mutationFn: (id: string) => startRequest(id),
    onError: (error) => {
      if (isRace(error)) qc.invalidateQueries({ queryKey: key });
      toast.error(t(errorKey(error) as never));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  });

  if (providerPending || isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const rows = queue ?? [];
  const steps = setupSteps(provider ?? null, items ?? [], profile ?? null);

  return (
    <>
      <SetupChecklist steps={steps} />

      <header className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("pq.title")}</h1>
          <p className="mt-1 text-ink-muted">
            {provider?.name}
            {provider && !provider.is_active ? ` \u00B7 ${t("pq.closed")}` : null}
          </p>
        </div>
        <p className="font-mono tnum text-sm text-ink-muted">
          <span className="text-3xl font-semibold text-ink">{rows.length}</span>{" "}
          {t("pq.waiting")}
        </p>
      </header>

      {rows.length === 0 ? (
        <EmptyState
          icon={CheckCheck}
          title={t("pq.emptyTitle")}
          body={
            provider?.is_active
              ? t("pq.emptyOpen")
              : t("pq.emptyClosed")
          }
        />
      ) : (
        <ul className="queue-rail space-y-3">
          {rows.map((row) => (
            <QueueRow
              key={row.id}
              row={row}
              now={now}
              onStart={(id) => start.mutate(id)}
              onFinish={(id) => finish.mutate(id)}
              pending={
                (finish.isPending && finish.variables === row.id) ||
                (start.isPending && start.variables === row.id)
              }
            />
          ))}
        </ul>
      )}
    </>
  );
}
