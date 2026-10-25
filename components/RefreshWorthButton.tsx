"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshInventoryWorth } from "@/lib/actions";
import { timeAgo } from "@/lib/format";

// Fetches the eBay estimated worth for every in-stock card in the collection.
export default function RefreshWorthButton({
  collectionId,
  updatedAt,
}: {
  collectionId: string;
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
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={handleRefresh} disabled={isPending} className="btn-chip">
        {isPending ? "Checking eBay…" : "Update est. worth from eBay"}
      </button>
      {!error && !isPending && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {updatedAt ? `Updated ${timeAgo(updatedAt)}` : "Not checked yet"}
        </p>
      )}
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
