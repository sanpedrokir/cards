import "server-only";
import { randomUUID } from "node:crypto";
import { cache } from "react";
import { sql, pool } from "./db";
import type { Card, Collection, CollectionData, Database, Investment, Sale } from "./types";

export const DEFAULT_COLLECTION_NAME = "My Collection";

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
    estimatedValue: toOptionalNumber(row.estimated_value),
    estimatedAt: row.estimated_at ? toIsoTimestamp(row.estimated_at) : undefined,
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
    thumbUrl: row.thumb_url ?? undefined,
    status: row.status,
    createdAt: toIsoTimestamp(row.created_at),
    collectionId: row.collection_id ?? undefined,
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCollection(row: any): Collection {
  return {
    id: row.id,
    name: row.name,
    createdAt: toIsoTimestamp(row.created_at),
    iconUrl: row.icon_url ?? undefined,
  };
}

// Sets (or, with null, clears) a collection's picture. Returns the previous
// picture URL so the caller can delete the old file.
export async function setCollectionIcon(
  userId: string,
  collectionId: string,
  iconUrl: string | null
): Promise<{ ok: false } | { ok: true; previous?: string }> {
  const rows = await sql`
    SELECT icon_url FROM collections WHERE id = ${collectionId} AND user_id = ${userId}
  `;
  if (rows.length === 0) return { ok: false };
  await sql`
    UPDATE collections SET icon_url = ${iconUrl}
    WHERE id = ${collectionId} AND user_id = ${userId}
  `;
  return { ok: true, previous: rows[0].icon_url ?? undefined };
}

// Every user always has at least one collection. A user's first visit after
// collections shipped (or a brand-new user) creates "My Collection" and
// adopts any cards / budget they already had from before collections
// existed, in one transaction. The advisory lock stops two simultaneous
// first requests (e.g. two tabs) from each creating their own default.
// cache(): the several helpers that each need the user's collections during
// one request share a single query instead of repeating it.
export const ensureCollections = cache(async function ensureCollections(
  userId: string
): Promise<Collection[]> {
  const rows = await sql`
    SELECT * FROM collections WHERE user_id = ${userId} ORDER BY created_at, id
  `;
  if (rows.length > 0) return rows.map(mapCollection);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);

    const existing = await client.query(
      "SELECT * FROM collections WHERE user_id = $1 ORDER BY created_at, id",
      [userId]
    );
    if (existing.rows.length > 0) {
      await client.query("COMMIT");
      return existing.rows.map(mapCollection);
    }

    const id = randomUUID();
    const created = await client.query(
      "INSERT INTO collections (id, user_id, name) VALUES ($1, $2, $3) RETURNING *",
      [id, userId, DEFAULT_COLLECTION_NAME]
    );
    await client.query(
      "UPDATE cards SET collection_id = $1 WHERE user_id = $2 AND collection_id IS NULL",
      [id, userId]
    );
    await client.query(
      "UPDATE investment SET collection_id = $1 WHERE user_id = $2 AND collection_id IS NULL",
      [id, userId]
    );
    await client.query("COMMIT");
    return created.rows.map(mapCollection);
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
});

export const FREE_COLLECTION_LIMIT = 2;
export const FREE_CARDS_PER_COLLECTION = 30;

export type CreateCollectionResult =
  | { ok: true; id: string }
  | { ok: false; reason: "limit-reached" };

// `maxCollections` is null for unlimited. The count and the insert happen
// under the same per-user lock as ensureCollections/deleteCollection, so two
// simultaneous requests can't both slip past the limit.
export async function createCollection(
  userId: string,
  name: string,
  maxCollections: number | null
): Promise<CreateCollectionResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);

    if (maxCollections !== null) {
      const count = await client.query(
        "SELECT COUNT(*)::int AS n FROM collections WHERE user_id = $1",
        [userId]
      );
      if (count.rows[0].n >= maxCollections) {
        await client.query("ROLLBACK");
        return { ok: false, reason: "limit-reached" };
      }
    }

    const id = randomUUID();
    await client.query(
      "INSERT INTO collections (id, user_id, name) VALUES ($1, $2, $3)",
      [id, userId, name]
    );
    await client.query("COMMIT");
    return { ok: true, id };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function renameCollection(
  userId: string,
  collectionId: string,
  name: string
): Promise<boolean> {
  const rows = await sql`
    UPDATE collections SET name = ${name}
    WHERE id = ${collectionId} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

export type DeleteCollectionResult =
  | { ok: true; imageUrls: string[] }
  | { ok: false; reason: "not-found" | "last-collection" };

// Deletes the collection together with every card and the budget in it.
// A user must always keep at least one collection.
export async function deleteCollection(
  userId: string,
  collectionId: string
): Promise<DeleteCollectionResult> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);

    const owned = await client.query(
      "SELECT id FROM collections WHERE user_id = $1",
      [userId]
    );
    if (!owned.rows.some((r) => r.id === collectionId)) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "not-found" };
    }
    if (owned.rows.length <= 1) {
      await client.query("ROLLBACK");
      return { ok: false, reason: "last-collection" };
    }

    const icon = await client.query(
      "SELECT icon_url FROM collections WHERE user_id = $1 AND id = $2",
      [userId, collectionId]
    );
    const images = await client.query(
      "SELECT image_url, thumb_url FROM cards WHERE user_id = $1 AND collection_id = $2 AND (image_url IS NOT NULL OR thumb_url IS NOT NULL)",
      [userId, collectionId]
    );
    await client.query("DELETE FROM cards WHERE user_id = $1 AND collection_id = $2", [
      userId,
      collectionId,
    ]);
    await client.query("DELETE FROM investment WHERE user_id = $1 AND collection_id = $2", [
      userId,
      collectionId,
    ]);
    await client.query("DELETE FROM collections WHERE user_id = $1 AND id = $2", [
      userId,
      collectionId,
    ]);
    await client.query("COMMIT");
    return {
      ok: true,
      imageUrls: [
        ...images.rows.flatMap((r) => [r.image_url, r.thumb_url]),
        icon.rows[0]?.icon_url,
      ].filter((u): u is string => typeof u === "string"),
    };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

// Permanently removes everything stored for a user (cards, budgets,
// collections, subscription record) in one transaction, and returns the image
// URLs so the caller can clean up the blobs. Safe to run again if a later
// step of account deletion failed.
export async function deleteAllUserData(userId: string): Promise<string[]> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);

    const images = await client.query(
      "SELECT image_url, thumb_url FROM cards WHERE user_id = $1 AND (image_url IS NOT NULL OR thumb_url IS NOT NULL)",
      [userId]
    );
    const icons = await client.query(
      "SELECT icon_url FROM collections WHERE user_id = $1 AND icon_url IS NOT NULL",
      [userId]
    );
    await client.query("DELETE FROM cards WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM investment WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM collections WHERE user_id = $1", [userId]);
    await client.query("DELETE FROM subscriptions WHERE user_id = $1", [userId]);
    await client.query("COMMIT");

    return [
      ...images.rows.flatMap((r) => [r.image_url, r.thumb_url]),
      ...icons.rows.map((r) => r.icon_url),
    ].filter((u): u is string => typeof u === "string");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function getInvestment(
  userId: string,
  collectionId: string
): Promise<Investment | null> {
  const rows = await sql`
    SELECT * FROM investment WHERE user_id = ${userId} AND collection_id = ${collectionId}
  `;
  return rows.length ? mapInvestment(rows[0]) : null;
}

export async function getCards(userId: string, collectionId: string): Promise<Card[]> {
  const rows = await sql`
    SELECT * FROM cards
    WHERE user_id = ${userId} AND collection_id = ${collectionId}
    ORDER BY created_at DESC
  `;
  return rows.map(mapCard);
}

// Every collection the user owns, each with its own budget and cards, for
// the dashboard's per-collection totals. Two queries total regardless of how
// many collections there are.
export async function readAllCollections(userId: string): Promise<CollectionData[]> {
  // All three reads go out together (one round trip, not two in a row).
  const [collectionRows, cardRows, investmentRows] = await Promise.all([
    sql`SELECT * FROM collections WHERE user_id = ${userId} ORDER BY created_at, id`,
    sql`SELECT * FROM cards WHERE user_id = ${userId} ORDER BY created_at DESC`,
    sql`SELECT * FROM investment WHERE user_id = ${userId}`,
  ]);

  // First visit ever (or since collections shipped): create + adopt the
  // default collection, then read again so the adopted rows are included.
  if (collectionRows.length === 0) {
    await ensureCollections(userId);
    return readAllCollections(userId);
  }
  const collections = collectionRows.map(mapCollection);

  return collections.map((collection) => {
    const investmentRow = investmentRows.find((r) => r.collection_id === collection.id);
    return {
      collection,
      db: {
        investment: investmentRow ? mapInvestment(investmentRow) : null,
        cards: cardRows.filter((r) => r.collection_id === collection.id).map(mapCard),
      },
    };
  });
}

// Collections page: names, pictures and card counts only, without pulling
// every card row (and its columns) just to count them.
export async function readCollectionSummaries(
  userId: string
): Promise<{ collection: Collection; cardCount: number }[]> {
  const [collectionRows, countRows] = await Promise.all([
    sql`SELECT * FROM collections WHERE user_id = ${userId} ORDER BY created_at, id`,
    sql`SELECT collection_id, COUNT(*)::int AS n FROM cards WHERE user_id = ${userId} GROUP BY collection_id`,
  ]);
  if (collectionRows.length === 0) {
    await ensureCollections(userId);
    return readCollectionSummaries(userId);
  }
  return collectionRows.map((row) => ({
    collection: mapCollection(row),
    cardCount: countRows.find((r) => r.collection_id === row.id)?.n ?? 0,
  }));
}

export interface CardsPageOptions {
  status: string;
  query: string;
  page: number;
  pageSize: number;
}

export interface CardsPageResult {
  cards: Card[];
  totalCount: number;
}

// Fetches only the one page of cards actually being displayed (with their
// full embedded photo), instead of the Vaulted Cards list loading every
// card a user owns on every visit just to filter/slice it in memory.
export async function getCardsPage(
  userId: string,
  collectionId: string,
  { status, query, page, pageSize }: CardsPageOptions
): Promise<CardsPageResult> {
  const offset = (Math.max(1, page) - 1) * pageSize;
  // Escape LIKE wildcards so searching "100%" or "a_b" matches literally.
  const likeQuery = `%${query.replace(/[\\%_]/g, "\\$&")}%`;

  const [rows, countRows] = await Promise.all([
    sql`
      SELECT * FROM cards
      WHERE user_id = ${userId} AND collection_id = ${collectionId}
        AND (${status} = 'all' OR status = ${status})
        AND (${query} = '' OR name ILIKE ${likeQuery})
      ORDER BY created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `,
    sql`
      SELECT COUNT(*) AS total FROM cards
      WHERE user_id = ${userId} AND collection_id = ${collectionId}
        AND (${status} = 'all' OR status = ${status})
        AND (${query} = '' OR name ILIKE ${likeQuery})
    `,
  ]);

  return {
    cards: rows.map(mapCard),
    totalCount: toNumber(countRows[0].total),
  };
}

export async function getCardById(userId: string, id: string): Promise<Card | null> {
  const rows = await sql`
    SELECT * FROM cards WHERE id = ${id} AND user_id = ${userId}
  `;
  return rows.length ? mapCard(rows[0]) : null;
}

export async function readDb(userId: string, collectionId: string): Promise<Database> {
  const [investment, cards] = await Promise.all([
    getInvestment(userId, collectionId),
    getCards(userId, collectionId),
  ]);
  return { investment, cards };
}

export async function upsertInvestment(
  userId: string,
  collectionId: string,
  data: Investment
): Promise<void> {
  await sql`
    INSERT INTO investment (user_id, collection_id, amount, currency, investment_date, notes)
    VALUES (${userId}, ${collectionId}, ${data.amount}, ${data.currency}, ${data.date}, ${data.notes ?? null})
    ON CONFLICT (collection_id) DO UPDATE SET
      amount = EXCLUDED.amount,
      currency = EXCLUDED.currency,
      investment_date = EXCLUDED.investment_date,
      notes = EXCLUDED.notes
  `;
}

export type PurchaseResult = "ok" | "card-limit-reached";

export async function insertCard(
  userId: string,
  collectionId: string,
  card: Card,
  maxCards: number | null = null
): Promise<PurchaseResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // `maxCards` is null for unlimited. Sold cards still count, so selling
    // and re-adding can't be used to get around the cap. The count runs under
    // a per-collection lock so two simultaneous adds can't both slip past it.
    if (maxCards !== null) {
      await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [
        `cards:${userId}:${collectionId}`,
      ]);
      const count = await client.query(
        "SELECT COUNT(*)::int AS n FROM cards WHERE user_id = $1 AND collection_id = $2",
        [userId, collectionId]
      );
      if (count.rows[0].n >= maxCards) {
        await client.query("ROLLBACK");
        return "card-limit-reached";
      }
    }

    await client.query(
      `INSERT INTO cards (
        id, user_id, collection_id, name, purchase_price, purchase_date, category, series, card_number,
        grade, grading_company, cert_number, quantity, notes, image_url, status, created_at, thumb_url,
        estimated_value, estimated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)`,
      [
        card.id, userId, collectionId, card.name, card.purchasePrice, card.purchaseDate,
        card.category ?? null, card.series ?? null, card.cardNumber ?? null,
        card.grade ?? null, card.gradingCompany ?? null, card.certNumber ?? null,
        card.quantity ?? null, card.notes ?? null, card.imageUrl ?? null,
        card.status, card.createdAt, card.thumbUrl ?? null, card.estimatedValue ?? null,
        card.estimatedAt ?? null,
      ]
    );
    await client.query("COMMIT");
    return "ok";
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function countCardsInCollection(
  userId: string,
  collectionId: string
): Promise<number> {
  const rows = await sql`
    SELECT COUNT(*)::int AS n FROM cards
    WHERE user_id = ${userId} AND collection_id = ${collectionId}
  `;
  return rows[0].n;
}

export type UpdatePriceResult = "ok" | "not-found" | "locked";

// Sold cards are locked: their recorded profit shouldn't change later.
export async function updateCardPurchasePrice(
  userId: string,
  cardId: string,
  newPrice: number
): Promise<UpdatePriceResult> {
  const rows = await sql`
    UPDATE cards SET purchase_price = ${newPrice}
    WHERE id = ${cardId} AND user_id = ${userId} AND status <> 'sold'
    RETURNING id
  `;
  if (rows.length > 0) return "ok";
  const exists = await sql`SELECT 1 FROM cards WHERE id = ${cardId} AND user_id = ${userId}`;
  return exists.length === 0 ? "not-found" : "locked";
}

// Estimated worth can be set (or cleared with null) on any card.
export async function updateCardEstimatedValue(
  userId: string,
  cardId: string,
  value: number | null
): Promise<boolean> {
  const rows = await sql`
    UPDATE cards SET estimated_value = ${value}, estimated_at = now()
    WHERE id = ${cardId} AND user_id = ${userId}
    RETURNING id
  `;
  return rows.length > 0;
}

// Converts every stored amount in one collection (its investment + every
// card's purchase/sale price and fees) to a new currency by multiplying by `rate`,
// in one transaction so the currency label and the amounts it labels never
// go out of sync partway through.
//
// Returns false (changing nothing) if the collection is no longer in
// `fromCurrency`, e.g. a double-click or second tab already converted it --
// otherwise the same conversion would be applied twice.
export async function convertCurrency(
  userId: string,
  collectionId: string,
  fromCurrency: string,
  toCurrency: string,
  rate: number
): Promise<boolean> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const converted = await client.query(
      `UPDATE investment SET currency = $1, amount = ROUND(amount * $2, 2) WHERE user_id = $3 AND collection_id = $4 AND currency = $5`,
      [toCurrency, rate, userId, collectionId, fromCurrency]
    );
    if (converted.rowCount === 0) {
      await client.query("ROLLBACK");
      return false;
    }
    await client.query(
      `UPDATE cards SET
        purchase_price = ROUND(purchase_price * $1, 2),
        estimated_value = CASE WHEN estimated_value IS NOT NULL THEN ROUND(estimated_value * $1, 2) ELSE NULL END,
        sale_price = CASE WHEN sale_price IS NOT NULL THEN ROUND(sale_price * $1, 2) ELSE NULL END,
        fees = CASE WHEN fees IS NOT NULL THEN ROUND(fees * $1, 2) ELSE NULL END
      WHERE user_id = $2 AND collection_id = $3`,
      [rate, userId, collectionId]
    );
    await client.query("COMMIT");
    return true;
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}

export async function deleteCard(userId: string, id: string): Promise<void> {
  await sql`DELETE FROM cards WHERE id = ${id} AND user_id = ${userId}`;
}

// Returns false if the card was already sold (or isn't this user's), so a
// double-submit can't overwrite the first sale's price and date.
export async function markCardSold(userId: string, id: string, sale: Sale): Promise<boolean> {
  const rows = await sql`
    UPDATE cards SET
      status = 'sold',
      sale_price = ${sale.salePrice},
      sale_date = ${sale.saleDate},
      buyer = ${sale.buyer ?? null},
      channel = ${sale.channel ?? null},
      fees = ${sale.fees ?? null},
      sale_notes = ${sale.notes ?? null}
    WHERE id = ${id} AND user_id = ${userId} AND status <> 'sold'
    RETURNING id
  `;
  return rows.length > 0;
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
