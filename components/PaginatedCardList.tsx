"use client";

import { useState } from "react";
import CardTile from "./CardTile";
import type { Card } from "@/lib/types";

const PAGE_SIZE = 5;

export default function PaginatedCardList({
  cards,
  currency,
}: {
  cards: Card[];
  currency: string;
}) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(cards.length / PAGE_SIZE));
  const pageItems = cards.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="space-y-3">
      {pageItems.map((card) => (
        <CardTile key={card.id} card={card} currency={currency} />
      ))}

      {pageCount > 1 && (
        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
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
            className="rounded-full px-3 py-1.5 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:text-blue-400"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
