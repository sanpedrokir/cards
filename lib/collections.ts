import "server-only";
import { cookies } from "next/headers";
import { ensureCollections } from "./store";
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
