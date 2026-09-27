import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { cardProfit } from "@/lib/calculations";
import { formatDate, formatMoney } from "@/lib/format";
import StatusBadge from "@/components/StatusBadge";
import DeleteCardButton from "@/components/DeleteCardButton";
import EbayPriceCheck from "@/components/EbayPriceCheck";
import SaleCelebration from "@/components/SaleCelebration";

export default async function CardDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sold?: string }>;
}) {
  const { id } = await params;
  const { sold } = await searchParams;
  const userId = await requirePageUserId();
  const db = await readDb(userId);
  const card = db.cards.find((c) => c.id === id);

  if (!card) notFound();

  const currency = db.investment?.currency ?? "SGD";
  const profit = card.sale ? cardProfit(card) : null;

  const details: Array<[string, string | undefined]> = [
    ["Category", card.category],
    ["Set / Series", card.series],
    ["Card Number", card.cardNumber],
    ["Grade", card.grade],
    ["Grading Company", card.gradingCompany],
    ["Cert / Serial # (PSA)", card.certNumber],
  ];

  return (
    <div className="mx-auto max-w-lg space-y-5">
      {sold === "1" && <SaleCelebration />}
      <Link
        href="/cards"
        className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back to Vaulted Cards
      </Link>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex gap-4">
          <div className="relative h-32 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
            {card.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={card.imageUrl}
                alt={card.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-4xl">
                🃏
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                {card.name}
              </h1>
              <StatusBadge status={card.status} />
            </div>
            <dl className="mt-2 space-y-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {details
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-1">
                    <dt className="text-zinc-400 dark:text-zinc-500">
                      {label}:
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {card.notes && (
          <p className="mt-4 rounded-lg bg-zinc-50 p-3 text-sm text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
            {card.notes}
          </p>
        )}
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Financial Information
        </h2>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">
              Purchase Price
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatMoney(card.purchasePrice, currency)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">
              Purchase Date
            </span>
            <span className="font-medium text-zinc-900 dark:text-zinc-50">
              {formatDate(card.purchaseDate)}
            </span>
          </div>

          {card.sale && (
            <>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Selling Price
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatMoney(card.sale.salePrice, currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 dark:text-zinc-400">
                  Sale Date
                </span>
                <span className="font-medium text-zinc-900 dark:text-zinc-50">
                  {formatDate(card.sale.saleDate)}
                </span>
              </div>
              {card.sale.fees !== undefined && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Fees
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {formatMoney(card.sale.fees, currency)}
                  </span>
                </div>
              )}
              {card.sale.buyer && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Buyer
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {card.sale.buyer}
                  </span>
                </div>
              )}
              {card.sale.channel && (
                <div className="flex justify-between">
                  <span className="text-zinc-500 dark:text-zinc-400">
                    Channel
                  </span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {card.sale.channel}
                  </span>
                </div>
              )}
              {card.sale.notes && (
                <p className="mt-2 rounded-lg bg-zinc-50 p-3 text-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-300">
                  {card.sale.notes}
                </p>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2 text-base dark:border-zinc-800">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  Profit
                </span>
                <span
                  className={`font-semibold ${
                    (profit ?? 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {(profit ?? 0) >= 0 ? "+" : ""}
                  {formatMoney(profit ?? 0, currency)}
                </span>
              </div>
            </>
          )}
        </div>

        {card.status === "available" && (
          <Link
            href={`/cards/${card.id}/sell`}
            className="mt-4 flex w-full items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Sell Card
          </Link>
        )}

        <DeleteCardButton cardId={card.id} cardName={card.name} />
      </div>

      <EbayPriceCheck cardId={card.id} />
    </div>
  );
}
