import type { Card, Database, Totals } from "./types";

export function getTotals(db: Database): Totals {
  const soldCards = db.cards.filter((c) => c.status === "sold");
  const availableCards = db.cards.filter((c) => c.status === "available");

  const inventoryCost = availableCards.reduce((sum, c) => sum + c.purchasePrice, 0);
  const inventoryEstimate = availableCards.reduce((sum, c) => sum + (c.estimatedValue ?? 0), 0);
  const totalSales = soldCards.reduce((sum, c) => sum + (c.sale?.salePrice ?? 0), 0);
  const totalProfit = soldCards.reduce((sum, c) => sum + cardProfit(c), 0);

  return { inventoryCost, inventoryEstimate, totalSales, totalProfit };
}

export function cardProfit(card: Card): number {
  if (!card.sale) return 0;
  return card.sale.salePrice - card.purchasePrice - (card.sale.fees ?? 0);
}
