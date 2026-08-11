"use client";

import { useState } from "react";
import { Search, SearchX } from "lucide-react";
import { useCategories, useDiscovery } from "@/lib/queries";
import { useT } from "@/i18n/client";
import { ProviderCard } from "@/components/teregna/provider-card";
import { EmptyState } from "@/components/teregna/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BrowseClient() {
  const t = useT();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const { data: categories } = useCategories();

  /**
   * A provider can rename their category or close at any time, which can strand
   * a selection that no longer exists - showing an empty list with no clue why.
   *
   * Derived rather than corrected in an effect: the selection is only ever
   * valid relative to the current category list, so there is nothing to store.
   */
  const activeCategory =
    category && categories?.includes(category) ? category : null;

  const { data, isPending, isError } = useDiscovery(search, activeCategory);

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
            placeholder={t("browse.searchPlaceholder")}
            aria-label={t("browse.searchLabel")}
            className="pl-9"
          />
        </div>

        {/* Only rendered once we know what exists. One category is not a
            filter - it is the whole list - so the row stays hidden. */}
        {categories && categories.length > 1 ? (
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("browse.filterLabel")}>
            <button
              type="button"
              onClick={() => setCategory(null)}
              aria-pressed={activeCategory === null}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium transition-colors",
                activeCategory === null
                  ? "bg-primary text-on-primary"
                  : "bg-muted text-ink-muted hover:text-ink",
              )}
            >
              {t("common.all")}
            </button>
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(activeCategory === c ? null : c)}
                aria-pressed={activeCategory === c}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-colors",
                  activeCategory === c
                    ? "bg-primary text-on-primary"
                    : "bg-muted text-ink-muted hover:text-ink",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        ) : null}
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
            title={t("browse.errorTitle")}
            body={t("browse.errorBody")}
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
            title={t("browse.emptyTitle")}
            body={
              search || activeCategory
                ? t("browse.emptyFiltered")
                : t("browse.emptyNone")
            }
          />
        )}
      </div>
    </>
  );
}
