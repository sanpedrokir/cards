import { requirePageUserId } from "@/lib/auth-helpers";
import { getCollectionContext, getCollectionLimit } from "@/lib/collections";
import { readCollectionSummaries } from "@/lib/store";
import CollectionManager from "@/components/CollectionManager";

export default async function CollectionsPage() {
  const userId = await requirePageUserId();
  const [all, { active }, limit] = await Promise.all([
    readCollectionSummaries(userId),
    getCollectionContext(userId),
    getCollectionLimit(userId),
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
        collections={all.map(({ collection, cardCount }) => ({
          id: collection.id,
          name: collection.name,
          cardCount,
          iconUrl: collection.iconUrl,
        }))}
        activeId={active.id}
        limit={limit}
      />
    </div>
  );
}
