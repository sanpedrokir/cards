import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import SellPickerForm from "@/components/SellPickerForm";

export default async function SalesPage() {
  const userId = await requirePageUserId();
  const db = await readDb(userId);
  const currency = db.investment?.currency ?? "SGD";
  const availableCards = db.cards.filter((c) => c.status === "available");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sales
      </h1>

      {availableCards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          <p>No cards available to sell.</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <SellPickerForm cards={availableCards} currency={currency} />
        </div>
      )}
    </div>
  );
}
