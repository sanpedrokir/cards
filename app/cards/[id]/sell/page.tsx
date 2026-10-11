import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requirePageUserId } from "@/lib/auth-helpers";
import { getCardById, getInvestment } from "@/lib/store";
import SellForm from "@/components/SellForm";
import EbayPriceCheck from "@/components/EbayPriceCheck";

export default async function SellCardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await requirePageUserId();
  const card = await getCardById(userId, id);

  if (!card) notFound();
  if (card.status === "sold") redirect(`/cards/${id}`);

  const investment = card.collectionId
    ? await getInvestment(userId, card.collectionId)
    : null;
  const currency = investment?.currency ?? "SGD";

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
