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

// Relative age of a timestamp, e.g. "3 hr ago".
export function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
}
