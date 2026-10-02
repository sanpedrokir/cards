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
import EditableAmount from "@/components/EditableAmount";
import CardImage from "@/components/CardImage";
import { updateCardPurchasePriceAction, updateCardSalePriceAction } from "@/lib/actions";

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
      <Link href="/cards" className="link-muted">
        ← Back to Vaulted Cards
      </Link>

      <div className="surface p-5">
        <div className="flex gap-4">
          <CardImage src={card.imageUrl} alt={card.name} />
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                {card.name}
              </h1>
              <StatusBadge status={card.status} />
            </div>
            <dl className="mt-2 space-y-0.5 text-sm text-slate-500 dark:text-slate-400">
              {details
                .filter(([, value]) => value)
                .map(([label, value]) => (
                  <div key={label} className="flex gap-1">
                    <dt className="text-slate-400 dark:text-slate-500">
                      {label}:
                    </dt>
                    <dd>{value}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {card.notes && (
          <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600 dark:bg-white/5 dark:text-slate-300">
            {card.notes}
          </p>
        )}
      </div>

      <div className="surface p-5">
        <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
          Financial Information
        </h2>

        <div className="mt-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Purchase Price
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              <EditableAmount
                action={updateCardPurchasePriceAction}
                hiddenFields={{ cardId: card.id }}
                amount={card.purchasePrice}
                currency={currency}
                ariaLabel="Edit purchase price"
                min="0.01"
              />
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">
              Purchase Date
            </span>
            <span className="font-medium text-slate-900 dark:text-white">
              {formatDate(card.purchaseDate)}
            </span>
          </div>

          {card.sale && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Selling Price
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  <EditableAmount
                    action={updateCardSalePriceAction}
                    hiddenFields={{ cardId: card.id }}
                    amount={card.sale.salePrice}
                    currency={currency}
                    ariaLabel="Edit sale amount"
                    min="0"
                  />
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">
                  Sale Date
                </span>
                <span className="font-medium text-slate-900 dark:text-white">
                  {formatDate(card.sale.saleDate)}
                </span>
              </div>
              {card.sale.fees !== undefined && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Fees
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {formatMoney(card.sale.fees, currency)}
                  </span>
                </div>
              )}
              {card.sale.buyer && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Buyer
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {card.sale.buyer}
                  </span>
                </div>
              )}
              {card.sale.channel && (
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">
                    Channel
                  </span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {card.sale.channel}
                  </span>
                </div>
              )}
              {card.sale.notes && (
                <p className="mt-2 rounded-lg bg-slate-50 p-3 text-slate-600 dark:bg-white/5 dark:text-slate-300">
                  {card.sale.notes}
                </p>
              )}
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base dark:border-white/10">
                <span className="font-semibold text-slate-900 dark:text-white">
                  Profit
                </span>
                <span
                  className={`font-semibold ${
                    (profit ?? 0) >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
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
          <div className="mt-4 flex justify-center">
            <Link
              href={`/cards/${card.id}/sell`}
              className="btn-primary-sm"
            >
              Mark as Sold
            </Link>
          </div>
        )}

        <DeleteCardButton cardId={card.id} cardName={card.name} />
      </div>

      <EbayPriceCheck cardId={card.id} />
    </div>
  );
}
