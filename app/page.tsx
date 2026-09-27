import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { getTotals } from "@/lib/calculations";
import { formatMoney, formatDate } from "@/lib/format";
import SummaryCard from "@/components/SummaryCard";
import CardTile from "@/components/CardTile";
import InvestmentForm from "@/components/InvestmentForm";
import InvestmentFundsPanel from "@/components/InvestmentFundsPanel";
import DeleteInvestmentButton from "@/components/DeleteInvestmentButton";

export default async function DashboardPage() {
  const userId = await requirePageUserId();
  const db = await readDb(userId);
  const { investment, cards } = db;

  if (!investment) {
    return (
      <div className="mx-auto max-w-md">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/vaulted-logo.png"
            alt="Vaulted"
            className="mx-auto h-28 w-28"
          />
          <h1 className="mt-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Welcome to Vaulted
          </h1>
        </div>
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <InvestmentForm investment={null} />
        </div>
      </div>
    );
  }

  const totals = getTotals(db);
  const currency = investment.currency;
  const recentCards = [...cards]
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-zinc-200 pb-4 text-sm dark:border-zinc-800">
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Total Invested: </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoney(totals.investedAmount, currency)}
          </span>
          <span className="ml-1 text-xs text-zinc-400 dark:text-zinc-500">
            (since {formatDate(investment.date)})
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Available Balance: </span>
          <span className="font-semibold text-blue-600 dark:text-blue-400">
            {formatMoney(totals.availableBalance, currency)}
          </span>
        </div>
        <div>
          <span className="text-zinc-500 dark:text-zinc-400">Cards Inventory: </span>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">
            {formatMoney(totals.inventoryCost, currency)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Link
          href="/cards/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Card
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total Sales"
          value={formatMoney(totals.totalSales, currency)}
        />
        <SummaryCard
          label="Total Profit"
          value={formatMoney(totals.totalProfit, currency)}
          tone={totals.totalProfit >= 0 ? "positive" : "negative"}
        />
        <SummaryCard
          label="Total Funds"
          value={formatMoney(totals.totalFunds, currency)}
          tone="purple"
        />
      </div>

      <div className="space-y-3">
        <InvestmentFundsPanel currentAmount={totals.investedAmount} />
        <div className="flex justify-end">
          <DeleteInvestmentButton />
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Recent Cards
          </h2>
          <Link
            href="/cards"
            className="text-sm font-medium text-blue-600 dark:text-blue-400"
          >
            View all
          </Link>
        </div>

        {recentCards.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-zinc-300 p-6 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
            No cards purchased yet.
          </p>
        ) : (
          <div className="space-y-3">
            {recentCards.map((card) => (
              <CardTile key={card.id} card={card} currency={currency} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
