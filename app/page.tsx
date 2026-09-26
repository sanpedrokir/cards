import Link from "next/link";
import { readDb } from "@/lib/store";
import { getTotals } from "@/lib/calculations";
import { formatMoney, formatDate } from "@/lib/format";
import SummaryCard from "@/components/SummaryCard";
import CardTile from "@/components/CardTile";
import InvestmentForm from "@/components/InvestmentForm";

export default async function DashboardPage() {
  const db = await readDb();
  const { investment, cards } = db;

  if (!investment) {
    return (
      <div className="mx-auto max-w-md">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Welcome to Card Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Start by recording the amount you&apos;ve invested into your card
          business.
        </p>
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h1>
        <Link
          href="/cards/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Purchase Card
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Initial Investment"
          value={formatMoney(totals.investedAmount, currency)}
          hint={formatDate(investment.date)}
        />
        <SummaryCard
          label="Available Balance"
          value={formatMoney(totals.availableBalance, currency)}
          tone="accent"
        />
        <SummaryCard
          label="Cards Inventory"
          value={formatMoney(totals.inventoryCost, currency)}
        />
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
          tone="accent"
        />
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
