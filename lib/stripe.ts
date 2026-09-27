import "server-only";
import Stripe from "stripe";

let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("STRIPE_SECRET_KEY environment variable is not set.");
  client = new Stripe(secretKey);
  return client;
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://vaultedcards.app";
}
