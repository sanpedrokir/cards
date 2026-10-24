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
  estimatedValue?: number;
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
  thumbUrl?: string;
  status: CardStatus;
  sale?: Sale;
  createdAt: string;
  collectionId?: string;
}

export interface Collection {
  id: string;
  name: string;
  createdAt: string;
  iconUrl?: string;
}

export interface CollectionData {
  collection: Collection;
  db: Database;
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
  inventoryCost: number;
  // Sum of the estimated worth entered on unsold cards (cards without one count as 0).
  inventoryEstimate: number;
  totalSales: number;
  totalProfit: number;
}
