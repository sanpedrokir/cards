"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshInventoryWorth } from "@/lib/actions";
import { timeAgo } from "@/lib/format";

// Stat pill for the dashboard hero: the estimated worth of the collection's
// in-stock cards (from eBay), with a button to refresh it for every card.
export default function InventoryWorthPill({
  collectionId,
  value,
  updatedAt,
}: {
  collectionId: string;
  value: string;
  updatedAt?: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      const res = await refreshInventoryWorth(collectionId);
      setError(res.error ?? null);
      router.refresh();
    });
  }

  return (
    <div>
      <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-slate-300/80">
        Market Value (eBay)
      </p>
      <p className="break-words text-sm font-bold tabular-nums text-white">{value}</p>
      <button
        type="button"
        onClick={handleRefresh}
        disabled={isPending}
        className="mt-1 text-[11px] font-medium text-emerald-300 underline-offset-2 hover:underline disabled:opacity-60"
      >
        {isPending ? "Checking eBay…" : "Update from eBay"}
      </button>
      {!error && !isPending && (
        <p className="mt-1 text-[11px] text-slate-300/80">
          {updatedAt ? `Updated ${timeAgo(updatedAt)}` : "Not checked yet"}
        </p>
      )}
      {error && <p className="mt-1 text-[11px] text-rose-300">{error}</p>}
    </div>
  );
}
