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

  // One grand-total row per currency, since collections can differ in currency.
  const grand = new Map<string, { cost: number; sales: number; profit: number; cards: number }>();
  for (const { db: d } of allCollections) {
    const cur = d.investment?.currency ?? "SGD";
    const t = getTotals(d);
    const g = grand.get(cur) ?? { cost: 0, sales: 0, profit: 0, cards: 0 };
    g.cost += t.totalCost;
    g.sales += t.totalSales;
    g.profit += t.totalProfit;
    g.cards += d.cards.length;
    grand.set(cur, g);
  }
  const rows = [
    ...[...grand].map(([cur, g]) => ({
      key: `total-${cur}`,
      name: grand.size > 1 ? `All collections total (${cur})` : "All collections total",
      cur,
      cost: g.cost,
      sales: g.sales,
      profit: g.profit,
      cards: g.cards,
    })),
    ...allCollections.map(({ collection, db: d }) => {
      const t = getTotals(d);
      return {
        key: collection.id,
        name: collection.name,
        cur: d.investment?.currency ?? "SGD",
        cost: t.totalCost,
        sales: t.totalSales,
        profit: t.totalProfit,
        cards: d.cards.length,
      };
    }),
  ];

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
          <div className="surface overflow-hidden border-0">
            {rows.map((r) => {
              return (
                <div key={r.key} className="space-y-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {r.name}
                    </span>
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-4">
                    <div>
                      <dt>Price paid</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(r.cost, r.cur)}
                      </dd>
                    </div>
                    <div>
                      <dt>Sales</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatMoney(r.sales, r.cur)}
                      </dd>
                    </div>
                    <div>
                      <dt>Profit</dt>
                      <dd
                        className={`mt-0.5 text-sm font-semibold tabular-nums ${
                          r.profit >= 0
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {formatMoney(r.profit, r.cur)}
                      </dd>
                    </div>
                    <div>
                      <dt>Cards</dt>
                      <dd className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900 dark:text-white">
                        {r.cards}
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
