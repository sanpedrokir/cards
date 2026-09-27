import Link from "next/link";
import { readDb } from "@/lib/store";
import SellPickerForm from "@/components/SellPickerForm";

export default async function SalesPage() {
  const db = await readDb();
  const currency = db.investment?.currency ?? "SGD";
  const availableCards = db.cards.filter((c) => c.status === "available");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sell a Card
      </h1>

      {availableCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <p>No cards available to sell.</p>
          <Link
            href="/cards/new"
            className="mt-3 inline-block rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Card
          </Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SellPickerForm cards={availableCards} currency={currency} />
        </div>
      )}
    </div>
  );
}
