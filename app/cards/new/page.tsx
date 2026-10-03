import Link from "next/link";
import { requirePageUserId } from "@/lib/auth-helpers";
import { readDb } from "@/lib/store";
import { getTotals } from "@/lib/calculations";
import PurchaseForm from "@/components/PurchaseForm";

export default async function NewCardPage() {
  const userId = await requirePageUserId();
  const db = await readDb(userId);

  const availableBalance = db.investment ? getTotals(db).availableBalance : null;

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/cards" className="link-muted">
          ← Back
        </Link>
      </div>
      <h1 className="page-title">Add Card</h1>

      <div className="surface p-5">
        <PurchaseForm
          availableBalance={availableBalance}
          currency={db.investment?.currency ?? "SGD"}
        />
      </div>
    </div>
  );
}
