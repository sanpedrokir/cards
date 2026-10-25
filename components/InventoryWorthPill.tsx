"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { refreshInventoryWorth } from "@/lib/actions";

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}

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
      {!result && !isPending && (
        <p className="mt-1 text-[11px] text-slate-300/80">
          {updatedAt ? `Updated ${timeAgo(updatedAt)}` : "Not checked yet"}
        </p>
      )}
      {result && (
        <p className={`mt-1 text-[11px] ${result.isError ? "text-rose-300" : "text-slate-300/80"}`}>
          {result.text}
        </p>
      )}
    </div>
  );
}
