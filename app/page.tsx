import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { getTotals } from "@/lib/calculations";
import { formatMoney } from "@/lib/format";
import SummaryCard from "@/components/SummaryCard";
import { SalesIcon, ProfitUpIcon, ProfitDownIcon, VaultIcon } from "@/components/icons";
import InvestedAmountEditor from "@/components/InvestedAmountEditor";
import PaginatedSalesTable from "@/components/PaginatedSalesTable";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ checkout?: string }>;
}) {
  const userId = await requirePageUserId();
  const db = await readDb(userId);
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
      {justSubscribed && (
        <p className="notice-success text-center">
          Subscribed! If you don&apos;t see your receipt email, please check
          your spam/junk folder.
        </p>
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
          <span className="text-base leading-none">+</span> Purchase
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <SummaryCard
          label="Total Sales"
          value={formatMoney(totals.totalSales, currency)}
          icon={<SalesIcon />}
        />
        <SummaryCard
          label="Total Profit"
          value={formatMoney(totals.totalProfit, currency)}
          tone={totals.totalProfit >= 0 ? "positive" : "negative"}
          icon={totals.totalProfit >= 0 ? <ProfitUpIcon /> : <ProfitDownIcon />}
        />
        {investment && (
          <SummaryCard
            label="Total Funds (Available funds + Sales)"
            value={formatMoney(totals.totalFunds, currency)}
            tone="accent"
            icon={<VaultIcon />}
          />
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            Sales
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
