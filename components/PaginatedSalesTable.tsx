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
    <div className="surface overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-white/5 dark:text-slate-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Card</th>
            <th className="px-3 py-2 text-right font-medium">Cost</th>
            <th className="px-3 py-2 text-right font-medium">Sold</th>
            <th className="px-3 py-2 text-right font-medium">Profit</th>
          </tr>
        </thead>
        <tbody>
          {pageItems.map((card) => {
            const profit = cardProfit(card);
            return (
              <tr key={card.id} className="border-t border-slate-100 dark:border-white/5">
                <td className="max-w-[120px] truncate px-3 py-2">
                  <Link
                    href={`/cards/${card.id}`}
                    className="text-slate-900 hover:text-indigo-600 hover:underline dark:text-white dark:hover:text-indigo-400"
                  >
                    {card.name}
                  </Link>
                </td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                  {formatMoney(card.purchasePrice, currency)}
                </td>
                <td className="px-3 py-2 text-right text-slate-600 dark:text-slate-300">
                  <EditableAmount
                    action={updateCardSalePriceAction}
                    hiddenFields={{ cardId: card.id }}
                    amount={card.sale!.salePrice}
                    currency={currency}
                    ariaLabel="Edit sale amount"
                    min="0"
                  />
                </td>
                <td
                  className={`px-3 py-2 text-right font-semibold ${
                    profit >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
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
            <tr className="border-t border-slate-100 dark:border-white/5">
              <td colSpan={4} className="px-3 py-2">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="rounded-full px-3 py-1 text-sm font-medium text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-400"
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
                    className="rounded-full px-3 py-1 text-sm font-medium text-indigo-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-indigo-400"
                  >
                    Next →
                  </button>
                </div>
              </td>
            </tr>
          )}
          <tr className="border-t-2 border-slate-200 bg-slate-50 font-semibold dark:border-white/10 dark:bg-white/5">
            <td colSpan={3} className="px-3 py-2 text-right text-slate-700 dark:text-slate-300">
              Total Profit
            </td>
            <td
              className={`px-3 py-2 text-right ${
                totalProfit >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
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
