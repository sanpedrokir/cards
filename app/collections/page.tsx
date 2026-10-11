import { requirePageUserId } from "@/lib/auth-helpers";
import { getCollectionContext } from "@/lib/collections";
import { readAllCollections } from "@/lib/store";
import CollectionManager from "@/components/CollectionManager";

export default async function CollectionsPage() {
  const userId = await requirePageUserId();
  const [all, { active }] = await Promise.all([
    readAllCollections(userId),
    getCollectionContext(userId),
  ]);

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div>
        <h1 className="page-title">Collections</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Each collection keeps its own cards, sales, profit and budget. Switch
          between them from any page.
        </p>
      </div>

      <CollectionManager
        collections={all.map(({ collection, db }) => ({
          id: collection.id,
          name: collection.name,
          cardCount: db.cards.length,
        }))}
        activeId={active.id}
      />
    </div>
  );
}
