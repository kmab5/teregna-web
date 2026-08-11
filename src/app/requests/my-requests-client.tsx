"use client";

import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Inbox, X } from "lucide-react";
import { useMyRequests } from "@/lib/queries";
import { cancelRequest } from "@/lib/rpc";
import { useT } from "@/i18n/client";
import { errorKey, isRace } from "@/lib/errors";
import { qk } from "@/lib/query-keys";
import { RequestStatusBadge } from "@/components/teregna/request-status-badge";
import { WaitTime } from "@/components/teregna/wait-time";
import { useNow } from "@/lib/use-now";
import { EmptyState } from "@/components/teregna/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocaleFormat } from "@/lib/use-locale-format";
import { ACTIVE_STATUSES, type MyRequest } from "@/lib/database.types";

export function MyRequestsClient({ userId }: { userId: string | undefined }) {
  const t = useT();
  const qc = useQueryClient();
  const { data, isPending } = useMyRequests(userId);
  const now = useNow();

  const cancel = useMutation({
    mutationFn: (id: string) => cancelRequest(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.myRequests() });
      toast.success(t("req.cancelled"));
    },
    onError: (error) => {
      // A race is the normal outcome of two people acting at once, not a bug.
      if (isRace(error)) qc.invalidateQueries({ queryKey: qk.myRequests() });
      toast.error(t(errorKey(error) as never));
    },
  });

  if (isPending) {
    return (
      <div className="mt-8 space-y-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  const rows = data ?? [];
  const active = rows.filter((r) => ACTIVE_STATUSES.includes(r.status));
  const past = rows.filter((r) => !ACTIVE_STATUSES.includes(r.status));

  if (rows.length === 0) {
    return (
      <div className="mt-8">
        <EmptyState
          icon={Inbox}
          title={t("req.emptyTitle")}
          body={t("req.emptyBody")}
          action={
            <Button asChild>
              <Link href="/browse">{t("landing.ctaFind")}</Link>
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-10">
      {active.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("req.waitingNow")}
          </h2>
          <ul className="space-y-3">
            {active.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                now={now}
                onCancel={() => cancel.mutate(r.id)}
                pending={cancel.isPending && cancel.variables === r.id}
              />
            ))}
          </ul>
        </section>
      ) : null}

      {past.length > 0 ? (
        <section>
          <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-muted">
            {t("req.earlier")}
          </h2>
          <ul className="space-y-3">
            {past.map((r) => (
              <RequestCard key={r.id} request={r} now={now} />
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function RequestCard({
  request,
  now,
  onCancel,
  pending,
}: {
  request: MyRequest;
  now: number;
  onCancel?: () => void;
  pending?: boolean;
}) {
  const t = useT();
  const { dateTime } = useLocaleFormat();
  const isActive = ACTIVE_STATUSES.includes(request.status);

  return (
    <li className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface p-3 elev-1 sm:gap-4 sm:p-4">
      {/* Position is the answer to the only question the receiver has. */}
      {isActive && request.position ? (
        <div className="flex shrink-0 flex-col items-center">
          <span className="font-mono tnum text-3xl font-semibold leading-none text-primary">
            {request.position}
          </span>
          <span className="mt-1 text-[0.65rem] uppercase tracking-wide text-ink-muted">
            {t("req.inLine")}
          </span>
        </div>
      ) : null}

      <div className="min-w-0 flex-1">
        <Link
          href={`/p/${request.provider_id}`}
          className="font-display text-lg font-semibold hover:text-primary"
        >
          {request.provider_name}
        </Link>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
          <RequestStatusBadge status={request.status} />
          {isActive ? (
            <WaitTime since={request.created_at} now={now} />
          ) : (
            <span className="font-mono tnum text-xs text-ink-muted">
              {dateTime(request.created_at)}
            </span>
          )}
        </div>

        {request.items.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {request.items.map((it, i) => (
              <li
                key={`${it.item_id ?? it.name}-${i}`}
                className="rounded-full bg-muted px-2.5 py-0.5 text-xs"
              >
                {it.quantity > 1 ? (
                  <span className="font-mono tnum">{it.quantity}× </span>
                ) : null}
                {it.name}
              </li>
            ))}
          </ul>
        ) : null}

        {request.note ? (
          <p className="mt-2 text-sm text-ink-muted">{request.note}</p>
        ) : null}
      </div>

      {isActive && onCancel ? (
        <Button
          variant="destructive"
          size="sm"
          onClick={onCancel}
          disabled={pending}
          className="shrink-0"
        >
          <X aria-hidden />
          <span className="hidden sm:inline">{t("common.cancel")}</span>
        </Button>
      ) : null}
    </li>
  );
}
