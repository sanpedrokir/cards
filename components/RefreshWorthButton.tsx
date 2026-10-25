"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshInventoryWorth } from "@/lib/actions";

// Fetches the eBay estimated worth for every in-stock card in the collection.
export default function RefreshWorthButton({ collectionId }: { collectionId: string }) {
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
      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
    </div>
  );
}
