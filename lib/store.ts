import "server-only";
import { Client } from "@neondatabase/serverless";
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

export async function setInvestmentAmount(userId: string, amount: number): Promise<void> {
  await sql`
    UPDATE investment SET amount = ${amount} WHERE user_id = ${userId}
  `;
}

export type PurchaseResult = "ok" | "no-investment" | "insufficient-balance";

// Locks the user's investment row for the duration of the transaction so a
// double-submit (double-click, two tabs) can't have both requests read the
// same pre-purchase balance and both succeed.
export async function insertCardIfAffordable(
  userId: string,
  card: Card
): Promise<PurchaseResult> {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    await client.query("BEGIN");

    const invResult = await client.query(
      "SELECT amount FROM investment WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (invResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return "no-investment";
    }

    const sumResult = await client.query(
      "SELECT COALESCE(SUM(purchase_price), 0) AS total FROM cards WHERE user_id = $1",
      [userId]
    );
    const investedAmount = toNumber(invResult.rows[0].amount);
    const purchaseCost = toNumber(sumResult.rows[0].total);
    const availableBalance = investedAmount - purchaseCost;

    if (card.purchasePrice > availableBalance) {
      await client.query("ROLLBACK");
      return "insufficient-balance";
    }

    await client.query(
      `INSERT INTO cards (
        id, user_id, name, purchase_price, purchase_date, category, series, card_number,
        grade, grading_company, cert_number, quantity, notes, image_url, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)`,
      [
        card.id, userId, card.name, card.purchasePrice, card.purchaseDate,
        card.category ?? null, card.series ?? null, card.cardNumber ?? null,
        card.grade ?? null, card.gradingCompany ?? null, card.certNumber ?? null,
        card.quantity ?? null, card.notes ?? null, card.imageUrl ?? null,
        card.status, card.createdAt,
      ]
    );
    await client.query("COMMIT");
    return "ok";
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export type UpdatePriceResult = "ok" | "not-found" | "insufficient-balance";

// Locks the investment row (and the card row) so a concurrent purchase can't
// read a stale available balance while this edit is in flight.
export async function updateCardPurchasePrice(
  userId: string,
  cardId: string,
  newPrice: number
): Promise<UpdatePriceResult> {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    await client.query("BEGIN");

    const invResult = await client.query(
      "SELECT amount FROM investment WHERE user_id = $1 FOR UPDATE",
      [userId]
    );
    if (invResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return "not-found";
    }

    const cardResult = await client.query(
      "SELECT id FROM cards WHERE id = $1 AND user_id = $2 FOR UPDATE",
      [cardId, userId]
    );
    if (cardResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return "not-found";
    }

    const sumResult = await client.query(
      "SELECT COALESCE(SUM(purchase_price), 0) AS total FROM cards WHERE user_id = $1 AND id != $2",
      [userId, cardId]
    );
    const investedAmount = toNumber(invResult.rows[0].amount);
    const otherCardsCost = toNumber(sumResult.rows[0].total);
    const availableBalance = investedAmount - otherCardsCost;

    if (newPrice > availableBalance) {
      await client.query("ROLLBACK");
      return "insufficient-balance";
    }

    await client.query(
      "UPDATE cards SET purchase_price = $1 WHERE id = $2 AND user_id = $3",
      [newPrice, cardId, userId]
    );
    await client.query("COMMIT");
    return "ok";
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}

export async function updateCardSalePrice(
  userId: string,
  cardId: string,
  newSalePrice: number
): Promise<boolean> {
  const rows = await sql`
    UPDATE cards SET sale_price = ${newSalePrice}
    WHERE id = ${cardId} AND user_id = ${userId} AND status = 'sold'
    RETURNING id
  `;
  return rows.length > 0;
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

const ACTIVE_SUBSCRIPTION_STATUSES = new Set(["active", "trialing", "past_due"]);

export interface SubscriptionRecord {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: string;
  currentPeriodEnd: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubscription(row: any): SubscriptionRecord {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    currentPeriodEnd: row.current_period_end ? toIsoTimestamp(row.current_period_end) : null,
    createdAt: toIsoTimestamp(row.created_at),
  };
}

export async function getSubscription(userId: string): Promise<SubscriptionRecord | null> {
  const rows = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId}`;
  return rows.length ? mapSubscription(rows[0]) : null;
}

export async function getAllSubscriptions(): Promise<SubscriptionRecord[]> {
  const rows = await sql`SELECT * FROM subscriptions ORDER BY created_at DESC`;
  return rows.map(mapSubscription);
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const rows = await sql`SELECT status FROM subscriptions WHERE user_id = ${userId}`;
  return rows.length > 0 && ACTIVE_SUBSCRIPTION_STATUSES.has(rows[0].status);
}

export async function upsertSubscriptionCustomer(
  userId: string,
  stripeCustomerId: string
): Promise<void> {
  await sql`
    INSERT INTO subscriptions (user_id, stripe_customer_id, status)
    VALUES (${userId}, ${stripeCustomerId}, 'incomplete')
    ON CONFLICT (user_id) DO UPDATE SET stripe_customer_id = EXCLUDED.stripe_customer_id
  `;
}

export async function getUserIdByStripeCustomerId(
  stripeCustomerId: string
): Promise<string | null> {
  const rows = await sql`
    SELECT user_id FROM subscriptions WHERE stripe_customer_id = ${stripeCustomerId}
  `;
  return rows.length ? rows[0].user_id : null;
}

let gateCache: { value: boolean; expiresAt: number } | null = null;
const GATE_CACHE_TTL_MS = 30_000;

export async function isSubscriptionGateEnabled(): Promise<boolean> {
  if (gateCache && gateCache.expiresAt > Date.now()) {
    return gateCache.value;
  }
  const rows = await sql`SELECT subscription_required FROM app_settings WHERE id = 1`;
  const value = rows.length ? Boolean(rows[0].subscription_required) : false;
  gateCache = { value, expiresAt: Date.now() + GATE_CACHE_TTL_MS };
  return value;
}

export async function setSubscriptionGateEnabled(enabled: boolean): Promise<void> {
  await sql`
    INSERT INTO app_settings (id, subscription_required)
    VALUES (1, ${enabled})
    ON CONFLICT (id) DO UPDATE SET subscription_required = EXCLUDED.subscription_required
  `;
  gateCache = { value: enabled, expiresAt: Date.now() + GATE_CACHE_TTL_MS };
}

export async function upsertSubscriptionFromStripe(
  userId: string,
  stripeCustomerId: string,
  data: {
    stripeSubscriptionId: string | null;
    status: string;
    currentPeriodEnd: string | null;
    eventCreatedAt: string;
  }
): Promise<void> {
  await sql`
    INSERT INTO subscriptions (
      user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end, last_event_at
    ) VALUES (
      ${userId}, ${stripeCustomerId}, ${data.stripeSubscriptionId}, ${data.status},
      ${data.currentPeriodEnd}, ${data.eventCreatedAt}
    )
    ON CONFLICT (user_id) DO UPDATE SET
      stripe_customer_id = EXCLUDED.stripe_customer_id,
      stripe_subscription_id = EXCLUDED.stripe_subscription_id,
      status = EXCLUDED.status,
      current_period_end = EXCLUDED.current_period_end,
      last_event_at = EXCLUDED.last_event_at,
      updated_at = now()
    WHERE subscriptions.last_event_at IS NULL
       OR EXCLUDED.last_event_at >= subscriptions.last_event_at
  `;
}
