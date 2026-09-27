"use client";

import { useState } from "react";
import { cardProfit } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
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
    <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-800/50 dark:text-zinc-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Card</th>
            <th className="px-3 py-2 text-right font-medium">Cost</th>
            <th className="px-3 py-2 text-right font-medium">Sold</th>
            <th className="px-3 py-2 text-right font-medium">Profit</th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-zinc-900">
          {pageItems.map((card) => {
            const profit = cardProfit(card);
            return (
              <tr key={card.id} className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="max-w-[120px] truncate px-3 py-2 text-zinc-900 dark:text-zinc-50">
                  {card.name}
                </td>
                <td className="px-3 py-2 text-right text-zinc-600 dark:text-zinc-300">
                  {formatMoney(card.purchasePrice, currency)}
                </td>
                <td className="px-3 py-2 text-right text-zinc-600 dark:text-zinc-300">
                  {formatMoney(card.sale!.salePrice, currency)}
                </td>
                <td
                  className={`px-3 py-2 text-right font-semibold ${
                    profit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {profit >= 0 ? "+" : ""}
                  {formatMoney(profit, currency)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          {pageCount > 1 && (
            <tr className="border-t border-zinc-100 dark:border-zinc-800">
              <td colSpan={4} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-full px-3 py-1 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Page {page + 1} of {pageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                    disabled={page >= pageCount - 1}
                    className="rounded-full px-3 py-1 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
                  >
                    Next →
                  </button>
                </div>
              </td>
            </tr>
          )}
          <tr className="border-t-2 border-zinc-200 bg-zinc-50 font-semibold dark:border-zinc-700 dark:bg-zinc-800/50">
            <td colSpan={3} className="px-3 py-2 text-right text-zinc-700 dark:text-zinc-300">
              Total Profit
            </td>
            <td
              className={`px-3 py-2 text-right ${
                totalProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-red-600 dark:text-red-400"
              }`}
            >
              {totalProfit >= 0 ? "+" : ""}
              {formatMoney(totalProfit, currency)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
