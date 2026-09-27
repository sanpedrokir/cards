import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import SellForm from "@/components/SellForm";

export default async function SellCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requirePageUserId();
  const db = await readDb(userId);
  const card = db.cards.find((c) => c.id === id);

  if (!card) notFound();
  if (card.status === "sold") redirect(`/cards/${id}`);

  const currency = db.investment?.currency ?? "SGD";

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link
        href={`/cards/${id}`}
        className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
      >
        ← Back
      </Link>
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Sell {card.name}
      </h1>

      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <SellForm
          cardId={card.id}
          purchasePrice={card.purchasePrice}
          currency={currency}
        />
      </div>
    </div>
  );
}
