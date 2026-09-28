"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import { currentUser } from "@clerk/nextjs/server";
import { requireAdminUserId, requirePageUserId, requireSignedInUserId } from "./auth-helpers";
import { getStripe, getAppUrl } from "./stripe";
import { searchEbayActiveListings, type EbayListing } from "./ebay";
import {
  deleteCard,
  getCardById,
  getInvestment,
  getSubscription,
  insertCardIfAffordable,
  isSubscriptionGateEnabled,
  markCardSold,
  setInvestmentAmount,
  setSubscriptionGateEnabled,
  updateCardPurchasePrice,
  updateCardSalePrice,
  upsertInvestment,
  upsertSubscriptionCustomer,
} from "./store";
import { todayIso } from "./format";
import type { Card, Sale } from "./types";
import type { FormState } from "./form-state";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

function revalidateInvestmentPaths() {
  revalidatePath("/");
  revalidatePath("/investment");
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

function textField(formData: FormData, name: string): string | undefined {
  const raw = formData.get(name);
  if (typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

async function encodeImage(
  file: File | null
): Promise<{ dataUrl?: string; error?: string }> {
  if (!file || file.size === 0) return {};
  if (!file.type.startsWith("image/")) {
    return { error: "Please upload a valid image file." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { error: "Image is too large. Please use a file under 3MB." };
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const compressed = await sharp(buffer)
      .rotate()
      .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .jpeg({ quality: 82 })
      .toBuffer();

    return { dataUrl: `data:image/jpeg;base64,${compressed.toString("base64")}` };
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

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64 = buffer.toString("base64");

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source: { type: "base64", media_type: file.type as any, data: base64 },
            },
            {
              type: "text",
              text: `Look at this photo of a collectible/trading card (it may be a raw card or a graded slab, e.g. PSA/BGS/CGC).

Extract these fields and reply with ONLY a JSON object, no markdown fences, no extra text:
{
  "name": short listing-style card name, e.g. "2016 Pokemon XY Evolutions FA/M Charizard EX" (combine year, set, and character/player as shown; omit words you can't read),
  "series": the set/series name if shown separately, e.g. "Evolutions", or null,
  "cardNumber": the card's print number within its set, e.g. "101" or "4/102", or null if not visible,
  "grade": the numeric grade if the card is professionally graded (e.g. "10"), or "0" if the card is ungraded/raw,
  "gradingCompany": the grading company name if graded, e.g. "PSA", "BGS", "CGC", or null if ungraded,
  "certNumber": the certification number printed on a graded slab (a long number, distinct from the card's print number), or null if ungraded or not visible
}

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

    return {
      name: parsed.name ?? undefined,
      series: parsed.series ?? undefined,
      cardNumber: parsed.cardNumber ?? undefined,
      grade: parsed.grade !== undefined && parsed.grade !== null ? String(parsed.grade) : undefined,
      gradingCompany: parsed.gradingCompany ?? undefined,
      certNumber: parsed.certNumber ?? undefined,
    };
  } catch {
    return { error: "Couldn't read that photo. Please enter the details manually." };
  }
}

export async function saveInvestment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const amount = numberField(formData, "amount");
  const currency = textField(formData, "currency") ?? "SGD";
  const date = textField(formData, "date") ?? todayIso();
  const notes = textField(formData, "notes");

  if (amount === undefined || amount <= 0) {
    return { error: "Enter a valid investment amount greater than zero." };
  }

  await upsertInvestment(userId, { amount, currency, date, notes });

  revalidateInvestmentPaths();
  redirect("/");
}

export async function updateInvestmentAmount(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const amount = numberField(formData, "amount");

  if (amount === undefined || amount <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  const investment = await getInvestment(userId);
  if (!investment) {
    return { error: "Set up your initial investment first." };
  }

  await setInvestmentAmount(userId, amount);

  revalidateInvestmentPaths();
  redirect("/");
}

export async function purchaseCard(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const name = textField(formData, "name");
  const purchasePrice = numberField(formData, "purchasePrice");
  const purchaseDate = textField(formData, "purchaseDate") ?? todayIso();
  const category = textField(formData, "category");
  const series = textField(formData, "series");
  const cardNumber = textField(formData, "cardNumber");
  const grade = textField(formData, "grade");
  const gradingCompany = textField(formData, "gradingCompany");
  const certNumber = textField(formData, "certNumber");
  const quantity = numberField(formData, "quantity");
  const notes = textField(formData, "notes");
  const imageFile = formData.get("image");

  if (!name) {
    return { error: "Card name is required." };
  }
  if (purchasePrice === undefined || purchasePrice <= 0) {
    return { error: "Enter a valid purchase price greater than zero." };
  }

  const { dataUrl: imageUrl, error: imageError } = await encodeImage(
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
    status: "available",
    createdAt: new Date().toISOString(),
  };
  const result = await insertCardIfAffordable(userId, card);
  if (result === "no-investment") {
    return { error: "Set up your initial investment before purchasing cards." };
  }
  if (result === "insufficient-balance") {
    return { error: "Insufficient available investment balance." };
  }

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
  if (amount === undefined || amount <= 0) {
    return { error: "Enter a valid purchase price greater than zero." };
  }

  const result = await updateCardPurchasePrice(userId, cardId, amount);
  if (result === "not-found") {
    return { error: "Card not found." };
  }
  if (result === "insufficient-balance") {
    return { error: "That price exceeds your available investment balance." };
  }

  revalidateCardPaths(cardId);
  return {};
}

export async function updateCardSalePriceAction(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const userId = await requirePageUserId();
  const cardId = textField(formData, "cardId");
  const amount = numberField(formData, "amount");

  if (!cardId) {
    return { error: "Missing card reference." };
  }
  if (amount === undefined || amount < 0) {
    return { error: "Enter a valid sale amount." };
  }

  const ok = await updateCardSalePrice(userId, cardId, amount);
  if (!ok) {
    return { error: "Card not found or not yet sold." };
  }

  revalidateCardPaths(cardId);
  return {};
}

export async function deleteCardAction(cardId: string): Promise<void> {
  const userId = await requirePageUserId();
  const card = await getCardById(userId, cardId);
  if (!card) return;

  await deleteCard(userId, cardId);

  revalidateCardPaths();
  redirect("/cards");
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

export async function toggleSubscriptionGate(): Promise<void> {
  await requireAdminUserId();
  const enabled = await isSubscriptionGateEnabled();
  await setSubscriptionGateEnabled(!enabled);
  revalidatePath("/admin");
}

export interface EbayPriceEstimate {
  recommendedPrice?: number;
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
      return { listings: [], error: "No comparable listings found on eBay." };
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
      currency: listings[0].currency,
    };
  } catch (err) {
    console.error("eBay price estimate failed:", err);
    return { listings: [], error: "Couldn't reach eBay. Please try again later." };
  }
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
  const saleDate = textField(formData, "saleDate") ?? todayIso();
  const buyer = textField(formData, "buyer");
  const channel = textField(formData, "channel");
  const fees = numberField(formData, "fees");
  const notes = textField(formData, "notes");

  if (!cardId) {
    return { error: "Missing card reference." };
  }
  if (salePrice === undefined || salePrice < 0) {
    return { error: "Enter a valid sales amount." };
  }

  const card = await getCardById(userId, cardId);
  if (!card) {
    return { error: "Card not found." };
  }
  if (card.status === "sold") {
    return { error: "This card has already been sold." };
  }

  const sale: Sale = { salePrice, saleDate, buyer, channel, fees, notes };
  await markCardSold(userId, cardId, sale);

  revalidateCardPaths(cardId);
  redirect(`/cards/${cardId}?sold=1`);
}
