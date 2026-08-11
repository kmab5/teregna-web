"use client";

import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import { useT } from "@/i18n/client";
import type { ProviderPublic } from "@/lib/database.types";

export function ProviderCard({ provider }: { provider: ProviderPublic }) {
  const t = useT();
  const busy = provider.queue_length > 0;
  return (
    <Link
      href={`/p/${provider.id}`}
      className="group flex flex-col rounded-[var(--radius-md)] border border-border bg-surface p-5 elev-1 transition-colors duration-150 hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-tight group-hover:text-primary">
          {provider.name}
        </h3>
        <span
          className={
            busy
              ? "shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
              : "shrink-0 rounded-full bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent"
          }
        >
          <Users className="mr-1 inline size-3" aria-hidden />
          <span className="font-mono tnum">{provider.queue_length === 0 ? t("queue.none") : t.plural("queue.waiting", provider.queue_length)}</span>
        </span>
      </div>

      {provider.description ? (
        <p className="mt-2 line-clamp-2 text-sm text-ink-muted">
          {provider.description}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
        {provider.category ? (
          <span className="rounded-full bg-muted px-2 py-0.5 capitalize">
            {provider.category}
          </span>
        ) : null}
        {provider.location ? (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3" aria-hidden />
            {provider.location}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
