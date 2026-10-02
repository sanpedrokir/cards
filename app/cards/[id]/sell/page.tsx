import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import SellForm from "@/components/SellForm";
import EbayPriceCheck from "@/components/EbayPriceCheck";

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
      <Link href={`/cards/${id}`} className="link-muted">
        ← Back
      </Link>
      <h1 className="page-title">Sell {card.name}</h1>

      <EbayPriceCheck cardId={card.id} />

      <div className="surface p-5">
        <SellForm
          cardId={card.id}
          purchasePrice={card.purchasePrice}
          currency={currency}
        />
      </div>
    </div>
  );
}
