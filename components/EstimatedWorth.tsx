"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshEstimatedWorth } from "@/lib/actions";
import { formatMoney } from "@/lib/format";

// Estimated worth comes only from eBay: the median asking price of similar
// active listings. No comparable listing means the card simply has no worth.
export default function EstimatedWorth({
  cardId,
  worth,
  currency,
}: {
  cardId: string;
  worth?: number;
  currency: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleRefresh() {
    setError(null);
    startTransition(async () => {
      const res = await refreshEstimatedWorth(cardId);
      if (res.error) setError(res.error);
      router.refresh();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="text-slate-500 dark:text-slate-400">Estimated Worth (eBay)</span>
        <span className="inline-flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-white">
            {worth !== undefined ? formatMoney(worth, currency) : "—"}
          </span>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isPending}
            className="btn-chip"
          >
            {isPending ? "Checking…" : worth !== undefined ? "Refresh" : "Get from eBay"}
          </button>
        </span>
      </div>
      {error && <p className="mt-1 text-right text-xs text-slate-500 dark:text-slate-400">{error}</p>}
    </div>
  );
}
