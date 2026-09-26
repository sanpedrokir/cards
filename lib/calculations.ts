import type { Card, Database, Totals } from "./types";

export function getTotals(db: Database): Totals {
  const investedAmount = db.investment?.amount ?? 0;
  const purchaseCost = db.cards.reduce((sum, c) => sum + c.purchasePrice, 0);
  const availableBalance = investedAmount - purchaseCost;

  const soldCards = db.cards.filter((c) => c.status === "sold");
  const availableCards = db.cards.filter((c) => c.status === "available");

  const inventoryCost = availableCards.reduce(
    (sum, c) => sum + c.purchasePrice,
    0
  );
  const totalSales = soldCards.reduce(
    (sum, c) => sum + (c.sale?.salePrice ?? 0),
    0
  );
  const totalProfit = soldCards.reduce((sum, c) => sum + cardProfit(c), 0);
  const totalFunds = availableBalance + totalSales;

  return {
    investedAmount,
    purchaseCost,
    availableBalance,
    inventoryCost,
    totalSales,
    totalProfit,
    totalFunds,
  };
}

export function cardProfit(card: Card): number {
  if (!card.sale) return 0;
  return card.sale.salePrice - card.purchasePrice - (card.sale.fees ?? 0);
}
