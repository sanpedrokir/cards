"use client";

import { useState } from "react";
import Link from "next/link";
import { cardProfit } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import { updateCardSalePriceAction } from "@/lib/actions";
import EditableAmount from "@/components/EditableAmount";
import type { Card } from "@/lib/types";

const PAGE_SIZE = 5;

export default function PaginatedSalesTable({
  soldCards,
  currency,
  totalProfit,
}: {
  soldCards: Card[];
  currency: string;
  totalProfit: number;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(soldCards.length / PAGE_SIZE));
  const pageItems = soldCards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="surface overflow-hidden divide-y divide-slate-100 dark:divide-white/5">
      {pageItems.map((card) => {
        const profit = cardProfit(card);
        const isProfit = profit >= 0;
        return (
          <div key={card.id} className="flex items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <Link
                href={`/cards/${card.id}`}
                className="block truncate text-sm font-medium text-slate-900 hover:text-amber-700 hover:underline dark:text-white dark:hover:text-amber-400"
              >
                {card.name}
              </Link>
              <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                <span>Cost {formatMoney(card.purchasePrice, currency)}</span>
                <span aria-hidden>→</span>
                <span className="inline-flex items-center gap-1">
                  Sold
                  <EditableAmount
                    action={updateCardSalePriceAction}
                    hiddenFields={{ cardId: card.id }}
                    amount={card.sale!.salePrice}
                    currency={currency}
                    ariaLabel="Edit sale amount"
                    min="0"
                  />
                </span>
              </p>
            </div>
            <span
              className={`shrink-0 whitespace-nowrap text-sm font-semibold ${
                isProfit ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isProfit ? "+" : ""}
              {formatMoney(profit, currency)}
            </span>
          </div>
        );
      })}

      {pageCount > 1 && (
        <div className="flex items-center justify-between p-3">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-full px-3 py-1 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-400"
          >
            ← Prev
          </button>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Page {page + 1} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={page >= pageCount - 1}
            className="rounded-full px-3 py-1 text-sm font-medium text-amber-700 disabled:cursor-not-allowed disabled:opacity-40 dark:text-amber-400"
          >
            Next →
          </button>
        </div>
      )}

      <div className="flex items-center justify-between bg-slate-50 p-3 font-semibold dark:bg-white/5">
        <span className="text-sm text-slate-700 dark:text-slate-300">Total Profit</span>
        <span
          className={`text-sm ${
            totalProfit >= 0
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-rose-600 dark:text-rose-400"
          }`}
        >
          {totalProfit >= 0 ? "+" : ""}
          {formatMoney(totalProfit, currency)}
        </span>
      </div>
    </div>
  );
}
