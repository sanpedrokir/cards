export type CardStatus = "available" | "sold";

export interface Sale {
  salePrice: number;
  saleDate: string;
  buyer?: string;
  channel?: string;
  fees?: number;
  notes?: string;
}

export interface Card {
  id: string;
  name: string;
  purchasePrice: number;
  purchaseDate: string;
  category?: string;
  series?: string;
  cardNumber?: string;
  grade?: string;
  gradingCompany?: string;
  certNumber?: string;
  quantity?: number;
  notes?: string;
  imageUrl?: string;
  status: CardStatus;
  sale?: Sale;
  createdAt: string;
}

export interface Investment {
  amount: number;
  currency: string;
  date: string;
  notes?: string;
}

export interface Database {
  investment: Investment | null;
  cards: Card[];
}

export interface Totals {
  investedAmount: number;
  purchaseCost: number;
  availableBalance: number;
  inventoryCost: number;
  totalSales: number;
  totalProfit: number;
  totalFunds: number;
}
