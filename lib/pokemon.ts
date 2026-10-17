import "server-only";

// Pokémon TCG API (pokemontcg.io). Market prices come from TCGplayer (USD)
// and Cardmarket (EUR). The API key is optional but gives far higher rate
// limits, so set POKEMONTCG_API_KEY in production.

export interface PokemonMatch {
  id: string;
  name: string;
  setName: string;
  number: string;
  imageUrl?: string;
  tcgplayerUrl?: string;
  // Best TCGplayer price (USD) and which printing it is for, e.g. "holofoil".
  marketUsd?: number;
  variant?: string;
  // Cardmarket trend price (EUR).
  trendEur?: number;
}

export interface PokemonLookup {
  matches: PokemonMatch[];
  // A friendly, non-error explanation (not a Pokémon card / no match found).
  info?: string;
  error?: string;
}

const API_URL = "https://api.pokemontcg.io/v2/cards";

function plain(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

// Only rejects when the user clearly filed the card under another game. A
// blank category is treated as "unknown" and still gets a lookup.
export function isPokemonCategory(category?: string): boolean | null {
  const c = category?.trim();
  if (!c) return null;
  return /pokemon/.test(plain(c));
}

function cleanTerm(text: string): string {
  return text.replace(/["\\]/g, " ").replace(/\s+/g, " ").trim();
}

// "020/189" -> "20", "TG01/TG30" -> "TG01"
function cardNumberTerm(raw?: string): string | null {
  const first = raw?.split("/")[0]?.trim();
  if (!first) return null;
  const stripped = /^\d+$/.test(first) ? String(Number(first)) : first;
  return /^[A-Za-z0-9-]+$/.test(stripped) ? stripped : null;
}

const VARIANT_ORDER = [
  "holofoil",
  "reverseHolofoil",
  "normal",
  "1stEditionHolofoil",
  "1stEditionNormal",
  "unlimitedHolofoil",
  "unlimited",
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMatch(card: any): PokemonMatch {
  const prices = card.tcgplayer?.prices ?? {};
  const variants = Object.keys(prices);
  const ordered = [
    ...VARIANT_ORDER.filter((v) => variants.includes(v)),
    ...variants.filter((v) => !VARIANT_ORDER.includes(v)),
  ];
  let marketUsd: number | undefined;
  let variant: string | undefined;
  for (const v of ordered) {
    const market = Number(prices[v]?.market);
    if (market > 0) {
      marketUsd = market;
      variant = v;
      break;
    }
  }
  const trend = Number(card.cardmarket?.prices?.trendPrice);

  return {
    id: card.id,
    name: card.name,
    setName: card.set?.name ?? "",
    number: card.number ?? "",
    imageUrl: card.images?.small,
    tcgplayerUrl: card.tcgplayer?.url,
    marketUsd,
    variant,
    trendEur: trend > 0 ? trend : undefined,
  };
}

async function query(q: string): Promise<PokemonMatch[]> {
  const url = new URL(API_URL);
  url.searchParams.set("q", q);
  url.searchParams.set("pageSize", "6");
  url.searchParams.set("orderBy", "-set.releaseDate");
  url.searchParams.set(
    "select",
    "id,name,number,set,images,tcgplayer,cardmarket"
  );

  const headers: Record<string, string> = {};
  if (process.env.POKEMONTCG_API_KEY) {
    headers["X-Api-Key"] = process.env.POKEMONTCG_API_KEY;
  }

  // The public API throws the occasional 5xx or stalls, so try twice
  // before giving up.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(5000),
        next: { revalidate: 3600 },
      });
      if (res.ok || res.status < 500) break;
    } catch {
      res = null;
    }
    await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
  }
  if (!res || !res.ok) {
    console.error("Pokemon TCG API request failed:", res?.status ?? "no response");
    throw new Error("Pokemon TCG API error.");
  }
  const data = await res.json();
  return Array.isArray(data.data) ? data.data.map(toMatch) : [];
}

export async function lookupPokemonCard(
  name: string,
  cardNumber?: string
): Promise<PokemonMatch[]> {
  const cleanName = cleanTerm(name);
  const number = cardNumberTerm(cardNumber);

  if (number) {
    const exact = await query(`name:"${cleanName}" number:"${number}"`);
    if (exact.length > 0) return exact;
  }
  return query(`name:"${cleanName}"`);
}
