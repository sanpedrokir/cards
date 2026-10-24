import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { countCardsInCollection, readDb } from "@/lib/store";
import { getCardLimit, withActiveCollection } from "@/lib/collections";
import CollectionSwitcher from "@/components/CollectionSwitcher";
import PurchaseForm from "@/components/PurchaseForm";

export default async function NewCardPage() {
  const userId = await requirePageUserId();
  const [{ collections, active, data: db }, cardLimit] = await Promise.all([
    withActiveCollection(userId, (id) => readDb(userId, id)),
    getCardLimit(userId),
  ]);

  // Sold cards still count towards the free cap (see insertCard).
  const atCardLimit =
    cardLimit !== null && (await countCardsInCollection(userId, active.id)) >= cardLimit;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <CollectionSwitcher collections={collections} activeId={active.id} />
      <div className="flex items-center gap-2">
        <Link href="/cards" className="link-muted">
          ← Back
        </Link>
      </div>
      <h1 className="page-title">Add Card</h1>

      <div className="surface p-5">
        {atCardLimit ? (
          <div className="space-y-3 text-center">
            <p className="font-semibold text-slate-900 dark:text-white">Card limit reached</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Free accounts can add up to {cardLimit} cards per collection. Subscribe to add
              more cards to {active.name}.
            </p>
            <Link href="/pricing" className="btn-primary w-full">
              Subscribe
            </Link>
          </div>
        ) : (
          <PurchaseForm
            collectionId={active.id}
          />
        )}
      </div>
    </div>
  );
}
