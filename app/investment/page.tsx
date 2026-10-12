import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { withActiveCollection } from "@/lib/collections";
import CollectionSwitcher from "@/components/CollectionSwitcher";
import InvestmentForm from "@/components/InvestmentForm";

export default async function InvestmentPage() {
  const userId = await requirePageUserId();
  const {
    collections,
    active,
    data: { investment },
  } = await withActiveCollection(userId, (id) => readDb(userId, id));

  return (
    <div className="mx-auto max-w-md space-y-4">
      <CollectionSwitcher collections={collections} activeId={active.id} />
      <div>
        <h1 className="page-title">Investment</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {investment
            ? "Update the amount invested into your card business."
            : "Optional: set a spending budget for your card business. You can skip this and just start purchasing — set it up here any time."}
        </p>
      </div>

      <div className="surface p-5">
        <InvestmentForm collectionId={active.id} investment={investment} />
      </div>
    </div>
  );
}
