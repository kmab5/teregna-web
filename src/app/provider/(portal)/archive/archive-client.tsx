"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Archive } from "lucide-react";
import { useMyProvider, useProviderArchive } from "@/lib/queries";
import { restoreRequest } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey, isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { ArchiveRow } from "@/components/teregna/archive-row";
import { EmptyState } from "@/components/teregna/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { RequestStatus } from "@/lib/database.types";

type Filter = "all" | RequestStatus;

export function ArchiveClient() {
  const t = useT();
  const qc = useQueryClient();
  const { data: provider } = useMyProvider();
  const { data, isPending } = useProviderArchive(provider?.id);
  const [filter, setFilter] = useState<Filter>("all");

  const restore = useMutation({
    // Back of the queue is the honest default: the work was not done, and the
    // people who arrived meanwhile did not do anything wrong.
    mutationFn: (id: string) => restoreRequest(id, "back"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.archive(provider!.id) });
      qc.invalidateQueries({ queryKey: qk.queue(provider!.id) });
      toast.success(t("arc.restoredTitle"), {
        description: t("arc.restoredBody"),
      });
    },
    onError: (error) => {
      if (isRace(error)) qc.invalidateQueries({ queryKey: qk.archive(provider!.id) });
      toast.error(t(errorKey(error) as never));
    },
  });

  if (isPending) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-9 w-48" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-20" />
        ))}
      </div>
    );
  }

  const rows = (data ?? []).filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <header className="mb-6">
        <h1 className="font-display text-2xl font-semibold">{t("arc.title")}</h1>
        <p className="mt-1 text-ink-muted">
          {t("arc.subtitle")}
        </p>
      </header>

      <div className="mb-5 flex gap-2">
        {(["all", "completed", "cancelled"] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
              filter === f
                ? "bg-primary text-on-primary"
                : "bg-muted text-ink-muted hover:text-ink",
            )}
          >
            {f === "all" ? t("common.all") : t(`status.${f}` as never)}
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Archive}
          title={t("arc.emptyTitle")}
          body={t("arc.emptyBody")}
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => (
            <ArchiveRow
              key={row.id}
              row={row}
              onRestore={(id) => restore.mutate(id)}
              pending={restore.isPending && restore.variables === row.id}
            />
          ))}
        </ul>
      )}
    </>
  );
}
