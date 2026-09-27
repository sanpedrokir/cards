import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import CardTile from "@/components/CardTile";
import CardFilterBar from "@/components/CardFilterBar";

export default async function CardsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "all", q = "" } = await searchParams;
  const userId = await requirePageUserId();
  const db = await readDb(userId);
  const currency = db.investment?.currency ?? "SGD";

  const query = q.trim().toLowerCase();
  const filtered = db.cards
    .filter((card) => status === "all" || card.status === status)
    .filter((card) => !query || card.name.toLowerCase().includes(query))
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Vaulted Cards
        </h1>
        <Link
          href="/cards/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          + Add Card
        </Link>
      </div>

      <CardFilterBar defaultQuery={q} defaultStatus={status} />

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
          No cards found.
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((card) => (
            <CardTile key={card.id} card={card} currency={currency} />
          ))}
        </div>
      )}
    </div>
  );
}
