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
    // Changing the filter/search invalidates whatever page you were on.
    params.delete("page");
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
        className="input-field mt-0"
      />
      <div className="flex gap-2">
        {FILTERS.map((filter) => {
          const active = defaultStatus === filter.value;
          return (
            <button
              key={filter.value}
              type="button"
              onClick={() => updateParams({ status: filter.value })}
              className={active ? "pill-active" : "pill"}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
