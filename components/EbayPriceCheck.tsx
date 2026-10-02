"use client";

import { useState, useTransition } from "react";
import { checkEbayPrice, type EbayPriceEstimate } from "@/lib/actions";
import { formatMoney } from "@/lib/format";

export default function EbayPriceCheck({ cardId }: { cardId: string }) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<EbayPriceEstimate | null>(null);

  function handleCheck() {
    startTransition(async () => {
      const res = await checkEbayPrice(cardId);
      setResult(res);
    });
  }

  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          eBay Market Check
        </h2>
        <button
          type="button"
          onClick={handleCheck}
          disabled={isPending}
          className="btn-chip"
        >
          {isPending ? "Checking…" : "Check eBay Price"}
        </button>
      </div>
      <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
        Guideline only, not a guaranteed sale price.
      </p>

      {result?.error && (
        <p className="mt-3 text-sm text-rose-600 dark:text-rose-400">{result.error}</p>
      )}

      {result && !result.error && (
        <div className="mt-3 space-y-3">
          {result.recommendedPrice !== undefined && (
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-950/40">
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                Suggested selling price
              </p>
              <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-300">
                {formatMoney(result.recommendedPrice, result.currency ?? "USD")}
              </p>
              <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-400/80">
                Based on {result.listings.length} similar active eBay listing
                {result.listings.length === 1 ? "" : "s"} (asking prices, not
                confirmed sales). Use this as a guideline only — your actual
                sale price isn&apos;t guaranteed.
              </p>
            </div>
          )}

          <ul className="space-y-1.5 text-sm">
            {result.listings.map((listing, i) => (
              <li key={i}>
                <a
                  href={listing.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <span className="truncate text-slate-600 dark:text-slate-300">
                    {listing.title}
                  </span>
                  <span className="shrink-0 font-medium text-slate-900 dark:text-white">
                    {formatMoney(listing.price, listing.currency)}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
