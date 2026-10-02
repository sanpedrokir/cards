import Link from "next/link";
import type { Card } from "@/lib/types";
import { cardProfit } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import CardImage from "./CardImage";

export default function CardTile({
  card,
  currency,
}: {
  card: Card;
  currency: string;
}) {
  const profit = card.sale ? cardProfit(card) : null;
  const isProfit = (profit ?? 0) >= 0;

  return (
    <Link
      href={`/cards/${card.id}`}
      className="surface flex gap-3 p-3 transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <CardImage src={card.imageUrl} alt={card.name} className="h-24 w-20 rounded-lg" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {card.name}
          </p>
          <StatusBadge status={card.status} />
        </div>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          Purchased {formatDate(card.purchaseDate)} ·{" "}
          {formatMoney(card.purchasePrice, currency)}
        </p>

        {card.sale && profit !== null && (
          <p className="mt-1 flex items-center gap-1 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Sold {formatDate(card.sale.saleDate)} ·{" "}
              {formatMoney(card.sale.salePrice, currency)} ·
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-semibold ${
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isProfit ? "▲" : "▼"}
              {formatMoney(Math.abs(profit), currency)}
            </span>
          </p>
        )}
      </div>
    </Link>
  );
}
