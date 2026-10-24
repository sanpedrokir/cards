import Link from "next/link";
import type { Card } from "@/lib/types";
import { cardProfit } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
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
  const sold = card.status === "sold";

  return (
    <Link href={`/cards/${card.id}`} prefetch={false} className="group block min-w-0">
      <div className="surface-raised p-2 transition-transform group-hover:-translate-y-0.5">
        <CardImage
          src={card.thumbUrl ?? card.imageUrl}
          alt={card.name}
          fit="contain"
          className="aspect-[3/4] w-full rounded-md"
        />
      </div>

      <div className="mt-1.5 space-y-0.5 px-0.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`rounded px-1.5 py-px text-[10px] font-bold uppercase leading-4 tracking-wide ${
              sold
                ? "bg-slate-600 text-slate-100"
                : "bg-emerald-400 text-emerald-950"
            }`}
          >
            {sold ? "Sold" : "In stock"}
          </span>
          {card.cardNumber && (
            <span className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              {card.cardNumber}
            </span>
          )}
        </div>

        <p className="line-clamp-2 text-[13px] font-bold leading-tight text-slate-900 dark:text-white">
          {card.name}
        </p>
        {card.series && (
          <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{card.series}</p>
        )}
        {grade && <span className="tag !text-[10px]">{grade}</span>}

        <div className="pt-1">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">Cost</p>
          <p className="text-[15px] font-bold leading-tight tabular-nums text-slate-900 dark:text-white">
            {formatMoney(card.purchasePrice, currency)}
          </p>
        </div>

        {!sold && card.estimatedValue !== undefined && (
          <div className="pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Est. worth</p>
            <p className="text-[15px] font-bold leading-tight tabular-nums text-amber-600 dark:text-amber-400">
              {formatMoney(card.estimatedValue, currency)}
            </p>
          </div>
        )}

        {card.sale && profit !== null && (
          <div className="pt-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Sold for</p>
            <p className="text-[15px] font-bold leading-tight tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatMoney(card.sale.salePrice, currency)}
            </p>
            <p
              className={`text-[11px] font-semibold ${
                isProfit
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isProfit ? "▲" : "▼"} {formatMoney(Math.abs(profit), currency)}
            </p>
          </div>
        )}
      </div>
    </Link>
  );
}
