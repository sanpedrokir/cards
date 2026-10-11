import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { getCollectionContext } from "@/lib/collections";
import CollectionSwitcher from "@/components/CollectionSwitcher";
import SellPickerForm from "@/components/SellPickerForm";

export default async function SalesPage() {
  const userId = await requirePageUserId();
  const { collections, active } = await getCollectionContext(userId);
  const db = await readDb(userId, active.id);
  const currency = db.investment?.currency ?? "SGD";
  const availableCards = db.cards.filter((c) => c.status === "available");

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <CollectionSwitcher collections={collections} activeId={active.id} />
      <h1 className="page-title">Sell</h1>

      {availableCards.length === 0 ? (
        <div className="surface-dashed p-8">
          <p>No cards available to sell.</p>
        </div>
      ) : (
        <div className="surface p-5">
          <SellPickerForm cards={availableCards} currency={currency} />
        </div>
      )}
    </div>
  );
}
