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
        <h1 className="page-title">Vaulted Cards</h1>
        <Link href="/cards/new" className="btn-primary-sm">
          <span className="text-base leading-none">+</span> Buy
        </Link>
      </div>

      <CardFilterBar defaultQuery={q} defaultStatus={status} />

      {filtered.length === 0 ? (
        <p className="surface-dashed p-8">No cards found.</p>
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
