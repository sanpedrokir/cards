import "server-only";
import { cookies } from "next/headers";
import { ensureCollections, FREE_COLLECTION_LIMIT, hasActiveSubscription } from "./store";
import type { Collection } from "./types";

export const ACTIVE_COLLECTION_COOKIE = "vaulted_collection";

export interface CollectionContext {
  collections: Collection[];
  active: Collection;
}

// The "active" collection is remembered in a cookie so every existing page
// and link keeps working without carrying a collection id around. A missing
// or stale cookie (deleted collection, someone else's id) falls back to the
// user's first collection.
export async function getCollectionContext(userId: string): Promise<CollectionContext> {
  const collections = await ensureCollections(userId);
  const store = await cookies();
  const wanted = store.get(ACTIVE_COLLECTION_COOKIE)?.value;
  const active = collections.find((c) => c.id === wanted) ?? collections[0];
  return { collections, active };
}

// Same as getCollectionContext, but also runs `fetcher` for the collection
// named in the cookie *at the same time* as the collection lookup, so a page
// pays one database round trip instead of two in a row. The cookie id is
// only a guess: if it turns out not to be the active collection (stale
// cookie, first visit) the fetch simply runs again with the right id. The
// speculative query is always scoped to the user, so a bad id returns nothing.
export async function withActiveCollection<T>(
  userId: string,
  fetcher: (collectionId: string) => Promise<T>
): Promise<CollectionContext & { data: T }> {
  const guess = (await cookies()).get(ACTIVE_COLLECTION_COOKIE)?.value;
  const [ctx, guessed] = await Promise.all([
    getCollectionContext(userId),
    guess ? fetcher(guess) : Promise.resolve(undefined),
  ]);
  const data =
    guess && ctx.active.id === guess ? (guessed as T) : await fetcher(ctx.active.id);
  return { ...ctx, data };
}

// Free accounts can have FREE_COLLECTION_LIMIT collections; subscribers (and
// the admin) have no cap. Returns null for "unlimited".
export async function getCollectionLimit(userId: string): Promise<number | null> {
  if (userId === process.env.ADMIN_USER_ID) return null;
  return (await hasActiveSubscription(userId)) ? null : FREE_COLLECTION_LIMIT;
}

// For server actions: honour the collection the form was rendered for (so a
// second tab on a different collection can't redirect a purchase), but only
// if it really belongs to this user; otherwise use the active one.
export async function resolveCollectionId(
  userId: string,
  requestedId?: FormDataEntryValue | null
): Promise<string> {
  const { collections, active } = await getCollectionContext(userId);
  if (typeof requestedId === "string" && collections.some((c) => c.id === requestedId)) {
    return requestedId;
  }
  return active.id;
}
