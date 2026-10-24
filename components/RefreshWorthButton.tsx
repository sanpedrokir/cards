"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshInventoryWorth } from "@/lib/actions";

// Fetches the eBay estimated worth for every in-stock card in the collection.
export default function RefreshWorthButton({ collectionId }: { collectionId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ text: string; isError: boolean } | null>(null);
  const router = useRouter();

  function handleRefresh() {
    setResult(null);
    startTransition(async () => {
      const res = await refreshInventoryWorth(collectionId);
      setResult(
        res.error
          ? { text: res.error, isError: true }
          : { text: res.message ?? "", isError: false }
      );
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
      <button type="button" onClick={handleRefresh} disabled={isPending} className="btn-chip">
        {isPending ? "Checking eBay…" : "Update est. worth from eBay"}
      </button>
      {result && (
        <p
          className={`text-xs ${
            result.isError ? "text-rose-600 dark:text-rose-400" : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {result.text}
        </p>
      )}
    </div>
  );
}
