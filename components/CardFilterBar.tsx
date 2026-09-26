"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
] as const;

export default function CardFilterBar({
  defaultQuery,
  defaultStatus,
}: {
  defaultQuery: string;
  defaultStatus: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function updateParams(next: { status?: string; q?: string }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.status !== undefined) {
      if (next.status === "all") params.delete("status");
      else params.set("status", next.status);
    }
    if (next.q !== undefined) {
      if (next.q === "") params.delete("q");
      else params.set("q", next.q);
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${pathname}?${query}` : pathname);
    });
  }

  return (
    <div className="space-y-3">
      <input
        type="search"
        placeholder="Search by card name…"
        defaultValue={defaultQuery}
        onChange={(e) => updateParams({ q: e.target.value })}
        className="w-full rounded-xl border border-zinc-300 px-3 py-2.5 text-base focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <div className="flex gap-2">
        {FILTERS.map((filter) => {
          const active = defaultStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateParams({ status: filter.value })}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
              }`}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
