"use client";

import { useState } from "react";
import { Search, SearchX } from "lucide-react";
import { useDiscovery } from "@/lib/queries";
import { ProviderCard } from "@/components/teregna/provider-card";
import { EmptyState } from "@/components/teregna/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const CATEGORIES = ["barber", "tailor", "clinic", "laundry", "repair"];

export function BrowseClient() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { data, isPending, isError } = useDiscovery(search, category);

  return (
    <>
      <div className="mt-6 space-y-3">
        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            aria-hidden
          />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name"
            aria-label="Search providers by name"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategory(null)}
            aria-pressed={category === null}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
              category === null
                ? "bg-primary text-on-primary"
                : "bg-muted text-ink-muted hover:text-ink",
            )}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(category === c ? null : c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                category === c
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-ink-muted hover:text-ink",
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        ) : isError ? (
          <EmptyState
            icon={SearchX}
            title="We could not load providers"
            body="Check your connection and try again."
          />
        ) : data && data.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((p) => (
              <ProviderCard key={p.id} provider={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={SearchX}
            title="Nothing matches that yet"
            body={
              search || category
                ? "Try a different name, or clear the filters."
                : "No providers are open right now. Check back shortly."
            }
          />
        )}
      </div>
    </>
  );
}
