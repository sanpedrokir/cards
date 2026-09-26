export const CURRENCIES = [
  "SGD",
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "AUD",
  "MYR",
  "HKD",
] as const;

export const SALE_CHANNELS = [
  "Carousell",
  "eBay",
  "Facebook",
  "Card Show",
  "Direct Sale",
  "Other",
] as const;

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency || "SGD",
      currencyDisplay: "symbol",
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "-";
  const date = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}
