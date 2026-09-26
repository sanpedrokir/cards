"use server";

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { mutateDb } from "./store";
import { getTotals } from "./calculations";
import { todayIso } from "./format";
import type { Card } from "./types";

export interface FormState {
  error?: string;
}

export const initialFormState: FormState = {};

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

async function saveImage(file: File | null): Promise<string | undefined> {
  if (!file || file.size === 0) return undefined;
  if (!file.type.startsWith("image/")) return undefined;

  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = path.extname(file.name) || "";
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadsDir, filename), buffer);

  return `/uploads/${filename}`;
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

  await mutateDb((db) => {
    db.investment = { amount, currency, date, notes };
  });

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

  const imageUrl = await saveImage(
    imageFile instanceof File ? imageFile : null
  );

  let newId = "";
  let insufficientFunds = false;
  let noInvestment = false;

  await mutateDb((db) => {
    if (!db.investment) {
      noInvestment = true;
      return;
    }
    const { availableBalance } = getTotals(db);
    if (purchasePrice > availableBalance) {
      insufficientFunds = true;
      return;
    }

    newId = randomUUID();
    const card: Card = {
      id: newId,
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
    db.cards.push(card);
  });

  if (noInvestment) {
    return {
      error: "Set up your initial investment before purchasing cards.",
    };
  }
  if (insufficientFunds) {
    return { error: "Insufficient available investment balance." };
  }

  revalidatePath("/");
  revalidatePath("/cards");
  redirect(`/cards/${newId}`);
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

  let notFound = false;
  let alreadySold = false;

  await mutateDb((db) => {
    const card = db.cards.find((c) => c.id === cardId);
    if (!card) {
      notFound = true;
      return;
    }
    if (card.status === "sold") {
      alreadySold = true;
      return;
    }
    card.status = "sold";
    card.sale = { salePrice, saleDate, buyer, channel, fees, notes };
  });

  if (notFound) {
    return { error: "Card not found." };
  }
  if (alreadySold) {
    return { error: "This card has already been sold." };
  }

  revalidatePath("/");
  revalidatePath("/cards");
  revalidatePath(`/cards/${cardId}`);
  redirect(`/cards/${cardId}`);
}
