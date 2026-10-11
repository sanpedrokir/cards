import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readAllCollections } from "@/lib/store";
import { getCollectionContext } from "@/lib/collections";
import { getTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import DashboardHero from "@/components/DashboardHero";
import InvestedAmountEditor from "@/components/InvestedAmountEditor";
import PaginatedSalesTable from "@/components/PaginatedSalesTable";
import CollectionSwitcher from "@/components/CollectionSwitcher";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const userId = await requirePageUserId();
  const [allCollections, { collections, active }] = await Promise.all([
    readAllCollections(userId),
    getCollectionContext(userId),
  ]);
  const db = allCollections.find((c) => c.collection.id === active.id)!.db;
  const { investment, cards } = db;
  const { checkout } = await searchParams;
  const justSubscribed = checkout === "success";

  const totals = getTotals(db);
  const currency = investment?.currency ?? "SGD";
  const soldCards = cards
    .filter((c) => c.status === "sold" && c.sale)
    .sort((a, b) => (a.sale!.saleDate < b.sale!.saleDate ? 1 : -1));

  return (
    <div className="space-y-6">
      <CollectionSwitcher collections={collections} activeId={active.id} />

      {justSubscribed && (
        <p className="notice-success text-center">
          Subscribed! If you don&apos;t see your receipt email, please check
          your spam/junk folder.
        </p>
      )}

      {allCollections.length > 1 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            All collections
          </h2>
          <div className="surface divide-y divide-slate-100 overflow-hidden dark:divide-white/5">
            {allCollections.map(({ collection, db: collectionDb }) => {
              const t = getTotals(collectionDb);
              const cur = collectionDb.investment?.currency ?? "SGD";
              const isActive = collection.id === active.id;
              return (
                <div key={collection.id} className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {collection.name}
                    </span>
                    {isActive && (
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                        Viewing
                      </span>
                    )}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <div className="flex justify-between gap-2">
                      <dt>Sales</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(t.totalSales, cur)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Profit</dt>
                      <dd
                        className={`font-semibold tabular-nums ${
                          t.totalProfit >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatMoney(t.totalProfit, cur)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Inventory</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(t.inventoryCost, cur)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>{collectionDb.investment ? "Balance" : "Cards"}</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {collectionDb.investment
                          ? formatMoney(t.availableBalance, cur)
                          : collectionDb.cards.length}
                      </dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {cards.length === 0 && (
        <p className="text-center text-sm text-slate-900 dark:text-white">
          Welcome to Vaulted! Record your first purchase to get started — a
          spending budget is optional, set one up any time.
        </p>
      )}

      <div className="surface flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
          {investment ? (
            <InvestedAmountEditor
              collectionId={active.id}
              amount={totals.investedAmount}
              currency={currency}
              since={investment.date}
            />
          ) : (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Overall Fund Invested: </span>
              <span className="font-semibold text-slate-900 dark:text-white">Not set</span>{" "}
              <Link href="/investment" className="link-muted">
                (Setup now, optional)
              </Link>
            </div>
          )}
          {investment && (
            <div>
              <span className="text-slate-500 dark:text-slate-400">Available Balance: </span>
              <span className="font-semibold text-amber-700 dark:text-amber-400">
                {formatMoney(totals.availableBalance, currency)}
              </span>
            </div>
          )}
          <div>
            <span className="text-slate-500 dark:text-slate-400">Cards Inventory: </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {formatMoney(totals.inventoryCost, currency)}
            </span>
          </div>
        </div>
        <Link href="/cards/new" className="btn-primary-sm">
          <span className="text-base leading-none">+</span> Add Card
        </Link>
      </div>

      <DashboardHero
        name={active.name}
        totals={totals}
        currency={currency}
        hasBudget={Boolean(investment)}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Sales{allCollections.length > 1 ? ` — ${active.name}` : ""}
          </h2>
          <Link href="/cards?status=sold" className="link-muted">
            View all
          </Link>
        </div>

        {soldCards.length === 0 ? (
          <p className="surface-dashed p-6">No sales yet.</p>
        ) : (
          <PaginatedSalesTable
            soldCards={soldCards}
            currency={currency}
            totalProfit={totals.totalProfit}
          />
        )}
      </div>

      <p className="pt-2 text-center text-xs text-slate-400 dark:text-slate-500">
        <a href="mailto:vaultedsup@gmail.com" className="hover:text-amber-700 dark:hover:text-amber-400">
          Contact Vaulted Support
        </a>
      </p>
    </div>
  );
}
