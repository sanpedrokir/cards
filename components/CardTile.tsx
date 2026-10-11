import Link from "next/link";
import type { Card } from "@/lib/types";
import { cardProfit } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import StatusBadge from "./StatusBadge";
import CardImage from "./CardImage";

// Grade is stored as text; "0" means an ungraded (raw) card.
function gradeLabel(card: Card): string | null {
  const grade = card.grade && card.grade !== "0" ? card.grade : null;
  if (!card.gradingCompany && !grade) return null;
  return [card.gradingCompany, grade].filter(Boolean).join(" ");
}

export default function CardTile({
  card,
  currency,
}: {
  card: Card;
  currency: string;
}) {
  const profit = card.sale ? cardProfit(card) : null;
  const isProfit = (profit ?? 0) >= 0;
  const grade = gradeLabel(card);

  return (
    <Link href={`/cards/${card.id}`} className="group block min-w-0">
      <div className="surface-raised p-3 transition-transform group-hover:-translate-y-0.5">
        <CardImage
          src={card.imageUrl}
          alt={card.name}
          fit="contain"
          className="aspect-[3/4] w-full rounded-lg"
        />
      </div>

      <div className="mt-2 space-y-1 px-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <StatusBadge status={card.status} />
          {card.cardNumber && (
            <span className="text-sm text-slate-500 dark:text-slate-400">
              {card.cardNumber}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-[15px] font-bold leading-snug text-slate-900 dark:text-white">
          {card.name}
        </p>
        {card.series && (
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{card.series}</p>
        )}
        {grade && <span className="tag">{grade}</span>}

        {card.sale && profit !== null ? (
          <div className="pt-0.5">
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatMoney(card.sale.salePrice, currency)}
            </p>
            <p
              className={`text-xs font-semibold ${
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isProfit ? "▲" : "▼"} {formatMoney(Math.abs(profit), currency)}{" "}
              {isProfit ? "profit" : "loss"}
            </p>
          </div>
        ) : (
          <div className="pt-0.5">
            <p className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
              {formatMoney(card.purchasePrice, currency)}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Cost</p>
          </div>
        )}
      </div>
    </Link>
  );
}
