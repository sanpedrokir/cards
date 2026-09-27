"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  addInvestmentFunds,
  deleteCard,
  getCardById,
  getCards,
  getInvestment,
  insertCard,
  markCardSold,
  upsertInvestment,
} from "./store";
import { getTotals } from "./calculations";
import { todayIso } from "./format";
import type { Card, Sale } from "./types";
import type { FormState } from "./form-state";

const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

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
  const dataUrl = `data:${file.type};base64,${buffer.toString("base64")}`;
  return { dataUrl };
}

export async function saveInvestment(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const amount = numberField(formData, "amount");
  const currency = textField(formData, "currency") ?? "SGD";
  const date = textField(formData, "date") ?? todayIso();
  const notes = textField(formData, "notes");

  if (amount === undefined || amount <= 0) {
    return { error: "Enter a valid investment amount greater than zero." };
  }

  await upsertInvestment({ amount, currency, date, notes });

  revalidatePath("/");
  revalidatePath("/investment");
  redirect("/");
}

export async function addFunds(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const amount = numberField(formData, "amount");

  if (amount === undefined || amount <= 0) {
    return { error: "Enter a valid amount greater than zero." };
  }

  const investment = await getInvestment();
  if (!investment) {
    return { error: "Set up your initial investment first." };
  }

  await addInvestmentFunds(amount);

  revalidatePath("/");
  revalidatePath("/investment");
  redirect("/");
}

export async function purchaseCard(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const name = textField(formData, "name");
  const purchasePrice = numberField(formData, "purchasePrice");
  const purchaseDate = textField(formData, "purchaseDate") ?? todayIso();
  const category = textField(formData, "category");
  const series = textField(formData, "series");
  const cardNumber = textField(formData, "cardNumber");
  const grade = textField(formData, "grade");
  const gradingCompany = textField(formData, "gradingCompany");
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

  const investment = await getInvestment();
  if (!investment) {
    return { error: "Set up your initial investment before purchasing cards." };
  }

  const cards = await getCards();
  const { availableBalance } = getTotals({ investment, cards });

  if (purchasePrice > availableBalance) {
    return { error: "Insufficient available investment balance." };
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
    quantity,
    notes,
    imageUrl,
    status: "available",
    createdAt: new Date().toISOString(),
  };
  await insertCard(card);

  revalidatePath("/");
  revalidatePath("/cards");
  redirect(`/cards/${id}`);
}

export async function deleteCardAction(cardId: string): Promise<void> {
  const card = await getCardById(cardId);
  if (!card) return;

  await deleteCard(cardId);

  revalidatePath("/");
  revalidatePath("/cards");
  redirect("/cards");
}

export async function sellCard(
  _prevState: FormState,
  formData: FormData
): Promise<FormState> {
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

  const card = await getCardById(cardId);
  if (!card) {
    return { error: "Card not found." };
  }
  if (card.status === "sold") {
    return { error: "This card has already been sold." };
  }

  const sale: Sale = { salePrice, saleDate, buyer, channel, fees, notes };
  await markCardSold(cardId, sale);

  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath(`/cards/${cardId}`);
  redirect(`/cards/${cardId}`);
}
