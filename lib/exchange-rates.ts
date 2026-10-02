import "server-only";

// Free, no API key required. Rates are refreshed daily, which is fine for
// an occasional bulk currency conversion (not real-time trading).
const EXCHANGE_RATE_API_BASE = "https://open.er-api.com/v6/latest";

export async function getExchangeRate(from: string, to: string): Promise<number> {
  if (from === to) return 1;

  const res = await fetch(`${EXCHANGE_RATE_API_BASE}/${encodeURIComponent(from)}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Could not reach the exchange rate service.");
  }

  const data = await res.json();
  if (data?.result !== "success") {
    throw new Error("Exchange rate service returned an error.");
  }

  const rate = data?.rates?.[to];
  if (typeof rate !== "number") {
    throw new Error(`No exchange rate available from ${from} to ${to}.`);
  }

  return rate;
}
