import "server-only";
import { sql } from "./db";
import type { Card, Database, Investment, Sale } from "./types";

function toNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function toOptionalNumber(value: unknown): number | undefined {
  return value === null || value === undefined ? undefined : toNumber(value);
}

function toIsoDate(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function toIsoTimestamp(value: unknown): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapInvestment(row: any): Investment {
  return {
    amount: toNumber(row.amount),
    currency: row.currency,
    date: toIsoDate(row.investment_date),
    notes: row.notes ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCard(row: any): Card {
  const card: Card = {
    id: row.id,
    name: row.name,
    purchasePrice: toNumber(row.purchase_price),
    purchaseDate: toIsoDate(row.purchase_date),
    category: row.category ?? undefined,
    series: row.series ?? undefined,
    cardNumber: row.card_number ?? undefined,
    grade: row.grade ?? undefined,
    gradingCompany: row.grading_company ?? undefined,
    certNumber: row.cert_number ?? undefined,
    quantity: row.quantity ?? undefined,
    notes: row.notes ?? undefined,
    imageUrl: row.image_url ?? undefined,
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
  };

  if (row.status === "sold" && row.sale_price !== null) {
    const sale: Sale = {
      salePrice: toNumber(row.sale_price),
      saleDate: toIsoDate(row.sale_date),
      buyer: row.buyer ?? undefined,
      channel: row.channel ?? undefined,
      fees: toOptionalNumber(row.fees),
      notes: row.sale_notes ?? undefined,
    };
    card.sale = sale;
  }

  return card;
}

export async function getInvestment(userId: string): Promise<Investment | null> {
  const rows = await sql`SELECT * FROM investment WHERE user_id = ${userId}`;
  return rows.length ? mapInvestment(rows[0]) : null;
}

export async function getCards(userId: string): Promise<Card[]> {
  const rows = await sql`
    SELECT * FROM cards WHERE user_id = ${userId} ORDER BY created_at DESC
  `;
  return rows.map(mapCard);
}

export async function getCardById(userId: string, id: string): Promise<Card | null> {
  const rows = await sql`
    SELECT * FROM cards WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows.length ? mapCard(rows[0]) : null;
}

export async function readDb(userId: string): Promise<Database> {
  const [investment, cards] = await Promise.all([
    getInvestment(userId),
    getCards(userId),
  ]);
  return { investment, cards };
}

export async function upsertInvestment(userId: string, data: Investment): Promise<void> {
  await sql`
    INSERT INTO investment (user_id, amount, currency, investment_date, notes)
    VALUES (${userId}, ${data.amount}, ${data.currency}, ${data.date}, ${data.notes ?? null})
    ON CONFLICT (user_id) DO UPDATE SET
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      investment_date = EXCLUDED.investment_date,
      notes = EXCLUDED.notes
  `;
}

export async function addInvestmentFunds(userId: string, amount: number): Promise<void> {
  await sql`
    UPDATE investment SET amount = amount + ${amount} WHERE user_id = ${userId}
  `;
}

export async function setInvestmentAmount(userId: string, amount: number): Promise<void> {
  await sql`
    UPDATE investment SET amount = ${amount} WHERE user_id = ${userId}
  `;
}

export async function deleteInvestment(userId: string): Promise<void> {
  await sql`DELETE FROM investment WHERE user_id = ${userId}`;
}

export async function insertCard(userId: string, card: Card): Promise<void> {
  await sql`
    INSERT INTO cards (
      id, user_id, name, purchase_price, purchase_date, category, series, card_number,
      grade, grading_company, cert_number, quantity, notes, image_url, status, created_at
    ) VALUES (
      ${card.id}, ${userId}, ${card.name}, ${card.purchasePrice}, ${card.purchaseDate},
      ${card.category ?? null}, ${card.series ?? null}, ${card.cardNumber ?? null},
      ${card.grade ?? null}, ${card.gradingCompany ?? null}, ${card.certNumber ?? null},
      ${card.quantity ?? null},
      ${card.notes ?? null}, ${card.imageUrl ?? null}, ${card.status}, ${card.createdAt}
    )
  `;
}

export async function deleteCard(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM cards WHERE id = ${id} AND user_id = ${userId}`;
}

export async function markCardSold(userId: string, id: string, sale: Sale): Promise<void> {
  await sql`
    UPDATE cards SET
      status = 'sold',
      sale_price = ${sale.salePrice},
      sale_date = ${sale.saleDate},
      buyer = ${sale.buyer ?? null},
      channel = ${sale.channel ?? null},
      fees = ${sale.fees ?? null},
      sale_notes = ${sale.notes ?? null}
    WHERE id = ${id} AND user_id = ${userId}
  `;
}
