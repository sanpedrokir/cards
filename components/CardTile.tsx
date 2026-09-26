import Link from "next/link";
import Image from "next/image";
import type { Card } from "@/lib/types";
import { cardProfit } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import StatusBadge from "./StatusBadge";

export default function CardTile({
  card,
  currency,
}: {
  card: Card;
  currency: string;
}) {
  const profit = card.sale ? cardProfit(card) : null;

  return (
    <Link
      href={`/cards/${card.id}`}
      className="flex gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {card.imageUrl ? (
          <Image
            src={card.imageUrl}
            alt={card.name}
            fill
            sizes="64px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🃏
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {card.name}
          </p>
          <StatusBadge status={card.status} />
        </div>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          Purchased {formatDate(card.purchaseDate)} ·{" "}
          {formatMoney(card.purchasePrice, currency)}
        </p>

        {card.sale && profit !== null && (
          <p className="mt-1 text-xs">
            Sold {formatMoney(card.sale.salePrice, currency)} ·{" "}
            <span
              className={
                profit >= 0
                  ? "font-semibold text-emerald-600 dark:text-emerald-400"
                  : "font-semibold text-red-600 dark:text-red-400"
              }
            >
              {profit >= 0 ? "+" : ""}
              {formatMoney(profit, currency)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
