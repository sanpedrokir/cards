import "server-only";

export interface EbayListing {
  title: string;
  price: number;
  currency: string;
  url: string;
  imageUrl?: string;
}

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getEbayAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value;
  }

  const appId = process.env.EBAY_APP_ID;
  const certId = process.env.EBAY_CERT_ID;
  if (!appId || !certId) {
    throw new Error("eBay isn't configured yet.");
  }

  const credentials = Buffer.from(`${appId}:${certId}`).toString("base64");
  const res = await fetch("https://api.ebay.com/identity/v1/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      scope: "https://api.ebay.com/oauth/api_scope",
    }),
  });

  if (!res.ok) {
    throw new Error("Could not authenticate with eBay.");
  }

  const data = await res.json();
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedToken.value;
}

export async function searchEbayActiveListings(
  query: string
): Promise<EbayListing[]> {
  const token = await getEbayAccessToken();

  const url = new URL("https://api.ebay.com/buy/browse/v1/item_summary/search");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", "8");

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      "X-EBAY-C-MARKETPLACE-ID": "EBAY_US",
    },
  });

  if (!res.ok) {
    throw new Error("eBay search failed.");
  }

  const data = await res.json();
  const items = Array.isArray(data.itemSummaries) ? data.itemSummaries : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return items.map((item: any) => ({
    title: item.title,
    price: Number(item.price?.value ?? 0),
    currency: item.price?.currency ?? "USD",
    url: item.itemWebUrl,
    imageUrl: item.image?.imageUrl,
  }));
}
