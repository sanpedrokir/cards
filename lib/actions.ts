"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { put, del } from "@vercel/blob";
import { cookies } from "next/headers";
import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { requireAdminUserId, requirePageUserId, requireSignedInUserId } from "./auth-helpers";
import {
  ACTIVE_COLLECTION_COOKIE,
  getCollectionContext,
  getCardLimit,
  getCollectionLimit,
  resolveCollectionId,
} from "./collections";
import { getStripe, getAppUrl } from "./stripe";
import { searchEbayActiveListings, type EbayListing } from "./ebay";
import { getExchangeRate } from "./exchange-rates";
import { cropToCard } from "./card-crop";
import {
  convertCurrency,
  createCollection,
  deleteAllUserData,
  deleteCard,
  deleteCollection,
  FREE_CARDS_PER_COLLECTION,
  getCardById,
  getInvestment,
  getSubscription,
  insertCard,
  isSubscriptionGateEnabled,
  markCardSold,
  renameCollection,
  setCollectionIcon,
  setSubscriptionGateEnabled,
  updateCardEstimatedValue,
  updateCardPurchasePrice,
  upsertInvestment,
  upsertSubscriptionCustomer,
} from "./store";
import { CURRENCIES, todayIso } from "./format";
import type { Card, Sale } from "./types";
import type { FormState } from "./form-state";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

const MAX_COLLECTION_NAME_LENGTH = 40;

function revalidateInvestmentPaths() {
  revalidatePath("/");
  revalidatePath("/cards/new");
  revalidatePath("/sales");
}

function revalidateCardPaths(cardId?: string) {
  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath("/cards/new");
  revalidatePath("/sales");
  if (cardId) revalidatePath(`/cards/${cardId}`);
}

function numberField(formData: FormData, name: string): number | undefined {
  const raw = formData.get(name);
  if (raw === null || raw === "") return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

// Dates come from <input type="date"> but a hand-built request could send
// anything, which Postgres would reject with a 500. Fall back to undefined.
function dateField(formData: FormData, name: string): string | undefined {
  const raw = textField(formData, name);
  if (!raw || !/^d{4}-d{2}-d{2}$/.test(raw)) return undefined;
  return Number.isNaN(Date.parse(raw)) ? undefined : raw;
}

function isCurrency(value: string): boolean {
  return (CURRENCIES as readonly string[]).includes(value);
}

// Keeps free-text fields to a sane size.
const MAX_TEXT_LENGTH = 500;
const MAX_AMOUNT = 100_000_000;

function textField(formData: FormData, name: string): string | undefined {
  const raw = formData.get(name);
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function encodeImage(
  file: File | null
): Promise<{ url?: string; thumbUrl?: string; error?: string }> {
  if (!file || file.size === 0) return {};
  if (!file.type.startsWith("image/")) {
    return { error: "Please upload a valid image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image is too large. Please use a file under 3MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    // Cards are only ever displayed as small thumbnails (CardTile, card
    // detail) except when someone taps through to view the photo full-size
    // before selling -- 800px is comfortably sharp for that on a phone
    // screen, while keeping stored rows (and every page that lists cards)
    // noticeably lighter than a near-original-resolution photo would be.
    // Apply the phone's rotation first, then crop to the card (best-effort,
    // see lib/card-crop.ts), then shrink.
    const oriented = await sharp(buffer).rotate().toBuffer();
    const cropped = await cropToCard(oriented);

    // Two sizes: a ~640px photo for the detail page / zoom, and a ~360px
    // thumbnail (roughly 15-25KB) for the card grid, which shows each card
    // only ~110-170px wide. Lists load the thumbnail, so they stay light.
    const [compressed, thumbnail] = await Promise.all([
      sharp(cropped)
        .resize({ width: 640, height: 640, fit: "inside", withoutEnlargement: true })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 72 })
        .toBuffer(),
      sharp(cropped)
        .resize({ width: 360, height: 360, fit: "inside", withoutEnlargement: true })
        .flatten({ background: { r: 255, g: 255, b: 255 } })
        .jpeg({ quality: 70 })
        .toBuffer(),
    ]);

    const name = randomUUID();
    const [blob, thumbBlob] = await Promise.all([
      put(`card-photos/${name}.jpg`, compressed, { access: "public", contentType: "image/jpeg" }),
      put(`card-photos/${name}-thumb.jpg`, thumbnail, { access: "public", contentType: "image/jpeg" }),
    ]);

    return { url: blob.url, thumbUrl: thumbBlob.url };
  } catch {
    return { error: "Couldn't process that image. Please try a different photo." };
  }
}

const SUPPORTED_SCAN_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export interface CardScanResult {
  name?: string;
  category?: string;
  series?: string;
  cardNumber?: string;
  grade?: string;
  gradingCompany?: string;
  certNumber?: string;
  error?: string;
}

export async function analyzeCardPhoto(
  formData: FormData
): Promise<CardScanResult> {
  const file = formData.get("image");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Select a photo of the card first." };
  }
  if (!SUPPORTED_SCAN_TYPES.has(file.type)) {
    return {
      error:
        "Unsupported photo format for scanning. Please use a JPEG, PNG, GIF, or WEBP photo (on iPhone, switch Camera Format to \"Most Compatible\" for JPEG output).",
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image is too large. Please use a photo under 3MB." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { error: "Card scanning isn't configured yet." };
  }

  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let base64: string;
  try {
    // Downscale before sending for analysis: a full-resolution phone photo
    // (several MB) takes much longer to upload to Claude and for the model
    // to process than a smaller image, with no benefit for reading printed
    // text. This only affects the copy sent for scanning, not the photo
    // saved with the card (see encodeImage below).
    const scanBuffer = await sharp(rawBuffer)
      .rotate()
      .resize({ width: 1024, height: 1024, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    base64 = scanBuffer.toString("base64");
  } catch {
    return { error: "Couldn't read that photo. Please try a different one." };
  }

  try {
    // Defaults are a 10-minute timeout and 2 silent retries -- fine for a
    // background job, bad for a form field someone is staring at. If the API
    // is rate-limited or slow, fail fast with a clear message instead of
    // leaving "Scanning..." stuck for a long time while the SDK quietly
    // retries with backoff.
    const client = new Anthropic({ apiKey, timeout: 20_000, maxRetries: 1 });
    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: "image/jpeg", data: base64 },
            },
            {
              type: "text",
              text: `Look at this photo of a collectible/trading card (it may be a raw card or a graded slab, e.g. PSA/BGS/CGC).

Extract these fields and reply with ONLY a JSON object, no markdown fences, no extra text:
{
  "name": short listing-style card name, e.g. "2016 Pokemon XY Evolutions FA/M Charizard EX" (combine year, set, and character/player as shown; omit words you can't read),
  "category": the trading card game or sport, e.g. "Pokémon", "One Piece", "Magic: The Gathering", "Yu-Gi-Oh!", "Dragon Ball", "Baseball", or null if unsure. Judge it from the card's own artwork, logo and layout,
  "series": the set/series name if shown separately, e.g. "Evolutions", or null,
  "cardNumber": the card's print number within its set, e.g. "101" or "4/102", or null if not visible,
  "grade": the numeric grade if the card is professionally graded (e.g. "10"), or "0" if the card is ungraded/raw,
  "gradingCompany": the grading company name if graded, e.g. "PSA", "BGS", "CGC", or null if ungraded,
  "certNumber": the certification number printed on the label of a graded slab (a long number, distinct from the card's print number), or null if the card is not in a grading slab or the number is not clearly legible. Never guess or invent digits
}

Only report grade, gradingCompany and certNumber when you can actually see a grading slab label. A raw card has grade "0" and null for gradingCompany and certNumber.

If you cannot identify the card at all, reply with {"error": "Could not identify the card in this photo."}`,
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text.trim() : "";
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    const parsed = JSON.parse(cleaned);

    if (parsed.error) {
      return { error: String(parsed.error) };
    }

    const grade =
      parsed.grade !== undefined && parsed.grade !== null ? String(parsed.grade) : undefined;
    // A raw card has no slab, so never carry a company or cert number for one.
    const graded = !!parsed.gradingCompany && !!grade && Number(grade) > 0;
    return {
      name: parsed.name ?? undefined,
      category: parsed.category ?? undefined,
      series: parsed.series ?? undefined,
      cardNumber: parsed.cardNumber ?? undefined,
      grade,
      gradingCompany: graded ? parsed.gradingCompany : undefined,
      certNumber: graded ? parsed.certNumber ?? undefined : undefined,
    };
  } catch (err) {
    if (err instanceof Anthropic.APIError && err.status === 429) {
      return {
        error: "Scanning is busy right now (too many people scanning at once). Please try again in a moment, or enter the details manually.",
      };
    }
    return { error: "Couldn't read that photo. Please enter the details manually." };
  }
}

export async function changeCurrencyAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const toCurrency = textField(formData, "currency");

  if (!toCurrency || !isCurrency(toCurrency)) {
    return { error: "Select a currency." };
  }

  const collectionId = await resolveCollectionId(userId, formData.get("collectionId"));
  // The collection's currency lives on its investment row; collections that
  // never had one are in SGD, so create an empty row to hold the new currency.
  let investment = await getInvestment(userId, collectionId);
  if (!investment) {
    investment = { amount: 0, currency: "SGD", date: todayIso() };
    await upsertInvestment(userId, collectionId, investment);
  }
  if (investment.currency === toCurrency) {
    return { error: `You're already using ${toCurrency}.` };
  }

  let rate: number;
  try {
    rate = await getExchangeRate(investment.currency, toCurrency);
  } catch {
    return {
      error: "Couldn't fetch today's exchange rate. Please try again in a moment.",
    };
  }

  const converted = await convertCurrency(
    userId,
    collectionId,
    investment.currency,
    toCurrency,
    rate
  );
  if (!converted) {
    return { error: "This collection was just converted. Refresh to see the new currency." };
  }

  revalidateInvestmentPaths();
  revalidateCardPaths();
  return {};
}

export async function purchaseCard(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const short = (field: string) => textField(formData, field)?.slice(0, MAX_TEXT_LENGTH);
  const name = short("name");
  // Optional: a card with no price entered is treated as costing nothing.
  const purchasePrice = numberField(formData, "purchasePrice") ?? 0;
  const purchaseDate = dateField(formData, "purchaseDate") ?? todayIso();
  const category = short("category");
  const series = short("series");
  const cardNumber = short("cardNumber");
  const grade = short("grade");
  const gradingCompany = short("gradingCompany");
  const certNumber = short("certNumber");
  const rawQuantity = numberField(formData, "quantity");
  const quantity =
    rawQuantity !== undefined && Number.isInteger(rawQuantity) && rawQuantity >= 1 && rawQuantity <= 100_000
      ? rawQuantity
      : undefined;
  const notes = short("notes");
  const imageFile = formData.get("image");

  if (!name) {
    return { error: "Card name is required." };
  }
  if (purchasePrice < 0 || purchasePrice > MAX_AMOUNT) {
    return { error: "Enter a valid purchase price." };
  }

  const { url: imageUrl, thumbUrl, error: imageError } = await encodeImage(
    imageFile instanceof File ? imageFile : null
  );
  if (imageError) {
    return { error: imageError };
  }

  const id = randomUUID();
  const card: Card = {
    id,
    name,
    purchasePrice,
    purchaseDate,
    category,
    series,
    cardNumber,
    grade,
    gradingCompany,
    certNumber,
    quantity,
    notes,
    imageUrl,
    thumbUrl,
    status: "available",
    createdAt: new Date().toISOString(),
  };
  const collectionId = await resolveCollectionId(userId, formData.get("collectionId"));
  const result = await insertCard(
    userId,
    collectionId,
    card,
    await getCardLimit(userId)
  );
  if (result !== "ok") {
    // The photo was already uploaded; don't leave it orphaned in storage.
    await Promise.all(
      [imageUrl, thumbUrl].map((url) => (url ? del(url).catch(() => {}) : undefined))
    );
  }
  if (result === "card-limit-reached") {
    return {
      error: `Free accounts can add up to ${FREE_CARDS_PER_COLLECTION} cards per collection. Subscribe to add more.`,
      upgrade: true,
    };
  }

  // The eBay lookup is slow (OAuth + search + exchange rate), so it runs after
  // the response instead of holding up the redirect. Best effort: a card with
  // no comparable listing just has no worth.
  after(async () => {
    try {
      const investment = await getInvestment(userId, collectionId);
      const worth = await ebayWorth(
        buildEbayQuery(name, gradingCompany, grade),
        investment?.currency ?? "SGD"
      );
      if (typeof worth === "number") await updateCardEstimatedValue(userId, id, worth);
    } catch (err) {
      console.error("Estimated worth lookup failed:", err);
    }
  });

  revalidateCardPaths();
  redirect(`/cards/${id}`);
}

export async function updateCardPurchasePriceAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const cardId = textField(formData, "cardId");
  const amount = numberField(formData, "amount");

  if (!cardId) {
    return { error: "Missing card reference." };
  }
  if (amount === undefined || amount < 0 || amount > MAX_AMOUNT) {
    return { error: "Enter a valid purchase price." };
  }

  const result = await updateCardPurchasePrice(userId, cardId, amount);
  if (result === "not-found") {
    return { error: "Card not found." };
  }
  if (result === "locked") {
    return { error: "This card has been sold, so its prices are locked." };
  }

  revalidateCardPaths(cardId);
  return {};
}

// Refreshes a card's estimated worth from eBay. With no comparable listing the
// card has no worth, so any earlier estimate is cleared.
export async function refreshEstimatedWorth(cardId: string): Promise<FormState> {
  const userId = await requirePageUserId();
  const card = await getCardById(userId, cardId);
  if (!card) return { error: "Card not found." };

  const investment = card.collectionId
    ? await getInvestment(userId, card.collectionId)
    : null;
  const worth = await ebayWorth(
    buildEbayQuery(card.name, card.gradingCompany, card.grade),
    investment?.currency ?? "SGD"
  );
  if (worth === "error") {
    return { error: "Couldn't reach eBay. Please try again later." };
  }

  await updateCardEstimatedValue(userId, cardId, worth);
  revalidateCardPaths(cardId);
  if (worth === null) return { error: NO_EBAY_PRICING };
  return {};
}

export async function deleteCardAction(cardId: string): Promise<void> {
  const userId = await requirePageUserId();
  const card = await getCardById(userId, cardId);
  if (!card) return;

  await deleteCard(userId, cardId);

  // Best-effort: don't fail the delete if blob cleanup has trouble (and
  // older cards may still have a legacy data: URI, which isn't a blob at all).
  for (const url of [card.imageUrl, card.thumbUrl]) {
    if (url?.startsWith("https://")) {
      await del(url).catch(() => {});
    }
  }

  revalidateCardPaths();
  redirect("/cards");
}

async function rememberActiveCollection(collectionId: string): Promise<void> {
  const store = await cookies();
  store.set(ACTIVE_COLLECTION_COOKIE, collectionId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

function revalidateCollectionPaths() {
  revalidateInvestmentPaths();
  revalidateCardPaths();
  revalidatePath("/collections");
}

export async function setActiveCollectionAction(collectionId: string): Promise<void> {
  const userId = await requirePageUserId();
  const { collections } = await getCollectionContext(userId);
  if (!collections.some((c) => c.id === collectionId)) return;

  await rememberActiveCollection(collectionId);
  revalidateCollectionPaths();
}

function collectionNameError(
  name: string | undefined,
  existingNames: string[]
): string | null {
  if (!name) return "Enter a collection name.";
  if (name.length > MAX_COLLECTION_NAME_LENGTH) {
    return `Collection names can be up to ${MAX_COLLECTION_NAME_LENGTH} characters.`;
  }
  if (existingNames.some((n) => n.toLowerCase() === name.toLowerCase())) {
    return "You already have a collection with that name.";
  }
  return null;
}

export async function createCollectionAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const name = textField(formData, "name");
  const { collections } = await getCollectionContext(userId);

  const error = collectionNameError(name, collections.map((c) => c.name));
  if (error || !name) return { error: error ?? "Enter a collection name." };

  const result = await createCollection(userId, name, await getCollectionLimit(userId));
  if (!result.ok) {
    return {
      error: "Free accounts can have up to 2 collections. Subscribe for unlimited collections.",
    };
  }
  await rememberActiveCollection(result.id);

  revalidateCollectionPaths();
  redirect("/");
}

export async function renameCollectionAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const collectionId = textField(formData, "collectionId");
  const name = textField(formData, "name");
  const { collections } = await getCollectionContext(userId);

  if (!collectionId || !collections.some((c) => c.id === collectionId)) {
    return { error: "Collection not found." };
  }

  const error = collectionNameError(
    name,
    collections.filter((c) => c.id !== collectionId).map((c) => c.name)
  );
  if (error || !name) return { error: error ?? "Enter a collection name." };

  await renameCollection(userId, collectionId, name);

  revalidateCollectionPaths();
  return {};
}

const MAX_ICON_BYTES = 3 * 1024 * 1024;

export async function setCollectionIconAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const collectionId = textField(formData, "collectionId");
  const file = formData.get("icon");
  const { collections } = await getCollectionContext(userId);

  if (!collectionId || !collections.some((c) => c.id === collectionId)) {
    return { error: "Collection not found." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a picture first." };
  }
  if (!file.type.startsWith("image/")) {
    return { error: "Please choose an image file." };
  }
  if (file.size > MAX_ICON_BYTES) {
    return { error: "That picture is too large. Please use one under 3MB." };
  }

  let url: string;
  try {
    // Small centred square: it's only ever shown as a ~56px circle.
    const icon = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(192, 192, { fit: "cover", position: "centre" })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 82 })
      .toBuffer();
    const blob = await put(`collection-icons/${randomUUID()}.jpg`, icon, {
      access: "public",
      contentType: "image/jpeg",
    });
    url = blob.url;
  } catch {
    return { error: "Couldn't process that picture. Please try a different one." };
  }

  const result = await setCollectionIcon(userId, collectionId, url);
  if (!result.ok) {
    await del(url).catch(() => {});
    return { error: "Collection not found." };
  }
  if (result.previous?.startsWith("https://")) {
    await del(result.previous).catch(() => {});
  }

  revalidateCollectionPaths();
  return {};
}

export async function removeCollectionIconAction(collectionId: string): Promise<void> {
  const userId = await requirePageUserId();
  const result = await setCollectionIcon(userId, collectionId, null);
  if (!result.ok) return;
  if (result.previous?.startsWith("https://")) {
    await del(result.previous).catch(() => {});
  }
  revalidateCollectionPaths();
}

// Deletes the collection along with every card and the budget inside it.
export async function deleteCollectionAction(collectionId: string): Promise<void> {
  const userId = await requirePageUserId();
  const result = await deleteCollection(userId, collectionId);
  if (!result.ok) return;

  // Best-effort, like deleteCardAction: don't fail the delete over blob cleanup.
  await Promise.all(
    result.imageUrls
      .filter((url) => url.startsWith("https://"))
      .map((url) => del(url).catch(() => {}))
  );

  // If the deleted collection was the active one, the cookie now points at a
  // collection that no longer exists; getCollectionContext falls back to the
  // user's first collection, so there's nothing to clear here.
  revalidateCollectionPaths();
  redirect("/collections");
}

export async function startCheckout(): Promise<void> {
  const userId = await requireSignedInUserId();
  const user = await currentUser();
  const email = user?.primaryEmailAddress?.emailAddress ?? user?.emailAddresses[0]?.emailAddress;

  const priceId = process.env.STRIPE_PRICE_ID;
  if (!priceId) {
    throw new Error("Billing isn't configured yet.");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  let customerId = (await getSubscription(userId))?.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId },
    });
    customerId = customer.id;
    await upsertSubscriptionCustomer(userId, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/?checkout=success`,
    cancel_url: `${appUrl}/pricing`,
    client_reference_id: userId,
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  if (!session.url) {
    throw new Error("Could not start checkout.");
  }

  redirect(session.url);
}

export async function openBillingPortal(): Promise<void> {
  const userId = await requireSignedInUserId();
  const subscription = await getSubscription(userId);

  if (!subscription) {
    redirect("/pricing");
  }

  const stripe = getStripe();
  const appUrl = getAppUrl();

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl}/`,
  });

  redirect(portalSession.url);
}

// Permanently deletes the signed-in user's account and everything in it
// (App Store rule 5.1.1(v) requires this to be possible from inside the app).
// Order matters: end billing first so a failure can never leave someone being
// charged for an account that's gone, then data, then the sign-in account.
// Every step is safe to repeat, so if one fails the user can just try again.
export async function deleteAccountAction(
  _prevState: FormState,
  _formData: FormData
): Promise<FormState> {
  // Not requirePageUserId: someone without a subscription must still be able
  // to delete their account, and that helper redirects them to /pricing.
  const userId = await requireSignedInUserId();

  try {
    const subscription = await getSubscription(userId);
    if (subscription?.stripeCustomerId) {
      // Deleting the Stripe customer also cancels any active subscription
      // immediately. Past charges and invoices stay in Stripe's records.
      await getStripe()
        .customers.del(subscription.stripeCustomerId)
        .catch((err: { code?: string }) => {
          if (err?.code !== "resource_missing") throw err;
        });
    }

    const imageUrls = await deleteAllUserData(userId);

    // Best-effort, like deleteCardAction: don't fail over blob cleanup.
    await Promise.all(
      imageUrls
        .filter((url) => url.startsWith("https://"))
        .map((url) => del(url).catch(() => {}))
    );

    const clerk = await clerkClient();
    await clerk.users.deleteUser(userId).catch((err: { status?: number }) => {
      if (err?.status !== 404) throw err;
    });
  } catch (err) {
    console.error("Account deletion failed:", err);
    return {
      error:
        "We couldn't finish deleting your account. Please try again, or email vaultedsup@gmail.com and we'll do it for you.",
    };
  }

  redirect("/sign-in");
}

export async function toggleSubscriptionGate(): Promise<void> {
  await requireAdminUserId();
  const enabled = await isSubscriptionGateEnabled();
  await setSubscriptionGateEnabled(!enabled);
  revalidatePath("/admin");
}

const EBAY_UNREACHABLE = "Couldn't reach eBay. Please try again later.";

export interface EbayPriceEstimate {
  recommendedPrice?: number;
  // Median asking price of the listings, before the selling discount.
  medianPrice?: number;
  currency?: string;
  listings: EbayListing[];
  error?: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function buildEbayQuery(
  name: string,
  gradingCompany?: string | null,
  grade?: string | null
): string {
  return [name, gradingCompany, grade && grade !== "0" ? grade : undefined]
    .filter(Boolean)
    .join(" ");
}

async function estimateEbayPrice(query: string): Promise<EbayPriceEstimate> {
  try {
    const listings = await searchEbayActiveListings(query);
    if (listings.length === 0) {
      return { listings: [], error: NO_EBAY_PRICING };
    }

    const prices = listings.map((l) => l.price).filter((p) => p > 0);
    if (prices.length === 0) {
      return { listings, currency: listings[0].currency };
    }

    const med = median(prices);
    // Asking prices run higher than what items typically sell for;
    // suggest listing a bit below the median ask to be competitive.
    const recommendedPrice = Math.round(med * 0.9 * 100) / 100;

    return {
      listings,
      recommendedPrice,
      medianPrice: Math.round(med * 100) / 100,
      currency: listings[0].currency,
    };
  } catch (err) {
    console.error("eBay price estimate failed:", err);
    return { listings: [], error: EBAY_UNREACHABLE };
  }
}

const NO_EBAY_PRICING = "No comparable pricing from eBay.";

// Median asking price of similar active eBay listings, converted from eBay's
// currency into `currency`. null: nothing comparable. "error": eBay or the
// exchange rate couldn't be reached.
async function ebayWorth(query: string, currency: string): Promise<number | null | "error"> {
  const estimate = await estimateEbayPrice(query);
  if (estimate.medianPrice === undefined || !estimate.currency) {
    return estimate.error === EBAY_UNREACHABLE ? "error" : null;
  }
  let value = estimate.medianPrice;
  if (estimate.currency !== currency) {
    try {
      value *= await getExchangeRate(estimate.currency, currency);
    } catch {
      return "error";
    }
  }
  return Math.round(value * 100) / 100;
}

export async function checkEbayPrice(cardId: string): Promise<EbayPriceEstimate> {
  const userId = await requirePageUserId();
  const card = await getCardById(userId, cardId);
  if (!card) {
    return { listings: [], error: "Card not found." };
  }

  const query = buildEbayQuery(card.name, card.gradingCompany, card.grade);
  return estimateEbayPrice(query);
}

export async function checkEbayPriceForQuery(
  name: string,
  gradingCompany?: string,
  grade?: string
): Promise<EbayPriceEstimate> {
  await requirePageUserId();

  if (!name.trim()) {
    return { listings: [], error: "Enter a card name first." };
  }

  const query = buildEbayQuery(name, gradingCompany, grade);
  return estimateEbayPrice(query);
}

export async function sellCard(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const cardId = textField(formData, "cardId");
  const salePrice = numberField(formData, "salePrice");
  const saleDate = dateField(formData, "saleDate") ?? todayIso();
  const buyer = textField(formData, "buyer")?.slice(0, MAX_TEXT_LENGTH);
  const channel = textField(formData, "channel")?.slice(0, MAX_TEXT_LENGTH);
  const fees = numberField(formData, "fees");
  const notes = textField(formData, "notes")?.slice(0, MAX_TEXT_LENGTH);

  if (!cardId) {
    return { error: "Missing card reference." };
  }
  if (salePrice === undefined || salePrice < 0 || salePrice > MAX_AMOUNT) {
    return { error: "Enter a valid sales amount." };
  }
  if (fees !== undefined && (fees < 0 || fees > MAX_AMOUNT)) {
    return { error: "Enter valid fees (zero or more)." };
  }

  const card = await getCardById(userId, cardId);
  if (!card) {
    return { error: "Card not found." };
  }
  if (card.status === "sold") {
    return { error: "This card has already been sold." };
  }

  const sale: Sale = { salePrice, saleDate, buyer, channel, fees, notes };
  if (!(await markCardSold(userId, cardId, sale))) {
    return { error: "This card has already been sold." };
  }

  revalidateCardPaths(cardId);
  redirect(`/cards/${cardId}?sold=1`);
}
