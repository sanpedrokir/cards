import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readAllCollections } from "@/lib/store";
import { getCollectionContext } from "@/lib/collections";
import { getTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import DashboardHero from "@/components/DashboardHero";
import CurrencyEditor from "@/components/CurrencyEditor";
import InventoryWorthPill from "@/components/InventoryWorthPill";
import PaginatedSalesTable from "@/components/PaginatedSalesTable";
import CollectionSwitcher from "@/components/CollectionSwitcher";

// Refreshing every card's eBay worth from the dashboard can take a while.
export const maxDuration = 60;

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
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <CollectionSwitcher collections={collections} activeId={active.id} />
        </div>
        <Link href="/cards/new" className="btn-primary-sm mb-5 shrink-0">
          <span className="text-base leading-none">+</span> Add Card
        </Link>
      </div>

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
                      <dt>Cost paid</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(t.inventoryCost, cur)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-2">
                      <dt>Cards</dt>
                      <dd className="font-semibold tabular-nums text-slate-900 dark:text-white">
                        {collectionDb.cards.length}
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
          Welcome to Vaulted! Record your first purchase to get started.
        </p>
      )}

      <DashboardHero
        name={active.name}
        totals={totals}
        currency={currency}
        worthPill={
          <InventoryWorthPill
            collectionId={active.id}
            value={formatMoney(totals.inventoryEstimate, currency)}
            updatedAt={totals.inventoryEstimatedAt}
          />
        }
        currencyPill={<CurrencyEditor collectionId={active.id} currency={currency} />}
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
