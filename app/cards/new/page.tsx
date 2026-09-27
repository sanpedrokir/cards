import Link from "next/link";
import { redirect } from "next/navigation";
import { readDb } from "@/lib/store";
import { getTotals } from "@/lib/calculations";
import PurchaseForm from "@/components/PurchaseForm";

export default async function NewCardPage() {
  const db = await readDb();

  if (!db.investment) {
    redirect("/investment");
  }

  const totals = getTotals(db);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link
          href="/cards"
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Back
        </Link>
      </div>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Purchase Card
      </h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <PurchaseForm
          availableBalance={totals.availableBalance}
          currency={db.investment.currency}
        />
      </div>
    </div>
  );
}
