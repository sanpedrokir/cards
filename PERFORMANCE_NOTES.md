# Fixing "every click is laggy" — sequential → parallel/pooled DB calls

This app (Vaulted) talks to a Neon Postgres database. Two separate problems were
stacking latency on top of each other on nearly every click. Below is exactly
what was found, why it was slow, and the before/after code.

---

## Problem 1 — a fresh database connection opened on every purchase/price-edit

**File:** `lib/store.ts` (functions `insertCardIfAffordable` and `updateCardPurchasePrice`)

These two functions need an interactive, multi-statement SQL transaction
(`BEGIN` → `SELECT ... FOR UPDATE` → conditional `INSERT`/`UPDATE` → `COMMIT`),
which requires a real TCP connection — not the one-shot HTTP driver (`sql`)
used everywhere else in the file.

### Before

```ts
export async function insertCardIfAffordable(
  userId: string,
  card: Card
): Promise<PurchaseResult> {
  const client = new Client(process.env.DATABASE_URL);
  await client.connect();

  try {
    await client.query("BEGIN");
    // ... FOR UPDATE / INSERT / COMMIT ...
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end();
  }
}
```

(`updateCardPurchasePrice` had the identical pattern.)

**Why this was slow:** `new Client(...)` + `.connect()` opens a brand-new
TCP connection and performs a fresh TLS handshake to the Postgres server,
*every single time the function is called* — then `.end()` immediately
tears it back down. A TCP+TLS handshake to a remote database is commonly
200–800ms depending on network distance/region. This function backs:

- The "Purchase" action (`purchaseCard` in `lib/actions.ts`)
- Every inline edit of a price via the pencil-icon `EditableAmount` component
  (used constantly on the dashboard, card list, and card detail page)

So the most-clicked interactions in the app were paying a full connection
setup/teardown cost on every single click.

### After

```ts
export async function insertCardIfAffordable(
  userId: string,
  card: Card
): Promise<PurchaseResult> {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    // ... FOR UPDATE / INSERT / COMMIT ...
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    client.release();
  }
}
```

`pool.connect()` borrows an already-open, already-authenticated connection
from a pool, and `client.release()` returns it to the pool instead of
closing it. No repeated handshake.

**Supporting change — `lib/db.ts`:**

```ts
// Before
import { neon } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);
```

```ts
// After
import { neon, Pool } from "@neondatabase/serverless";

export const sql = neon(process.env.DATABASE_URL);

// Reuse one connection pool across requests (and across hot-reloads in dev)
// instead of opening a fresh TCP+TLS connection per transactional query.
const globalForPool = globalThis as unknown as { __neonPool?: Pool };

export const pool =
  globalForPool.__neonPool ??
  (globalForPool.__neonPool = new Pool({ connectionString: process.env.DATABASE_URL }));
```

The `globalThis` cache is the same trick commonly used for Prisma client
singletons: it survives Next.js dev-mode hot-reloads (which re-execute
modules) and survives repeated warm invocations of the same serverless
function instance, so the pool is created once, not once per request.

---

## Problem 2 — two auth-gate DB checks run one-after-another on every page

**File:** `lib/auth-helpers.ts` (function `requirePageUserId`)

Every protected page (dashboard, cards list, card detail, new purchase,
sell, etc.) calls `requirePageUserId()` before rendering. It needs to know
two things: (1) is the paywall gate currently turned on, and (2) does this
user have an active subscription. Both come from the database.

### Before

```ts
export async function requirePageUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const gateEnabled = await isSubscriptionGateEnabled();
  if (gateEnabled && !(await hasActiveSubscription(userId))) {
    redirect("/pricing");
  }

  return userId;
}
```

**Why this was slow:** because of the `&&` short-circuit, these two
`await`s run strictly one after the other: wait for the full round-trip of
`isSubscriptionGateEnabled()`, *then* start the round-trip for
`hasActiveSubscription()`. Two sequential network round-trips instead of
one, on literally every page load — stacked on top of whatever the page's
own data queries (`readDb`) also cost.

### After

```ts
export async function requirePageUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const [gateEnabled, hasSubscription] = await Promise.all([
    isSubscriptionGateEnabled(),
    hasActiveSubscription(userId),
  ]);
  if (gateEnabled && !hasSubscription) {
    redirect("/pricing");
  }

  return userId;
}
```

`Promise.all` fires both queries at the same time and waits for whichever
finishes last, instead of waiting for the first before even starting the
second. One round-trip's worth of latency instead of two. (Minor tradeoff:
`hasActiveSubscription` now always runs even when the gate is off, but that
one extra always-cheap query is far less costly than serializing both.)

---

## The general pattern to look for

| Smell | Why it's slow | Fix |
|---|---|---|
| `new Client(...)` / `.connect()` / `.end()` inside a function that's called per-request | Pays a full TCP+TLS handshake every call | Use a long-lived `Pool`, `.connect()` / `.release()` |
| `const a = await f(); const b = await g();` where `b` doesn't depend on `a`'s *value* (only on timing/control-flow) | Two round-trips become sequential instead of overlapping | `Promise.all([f(), g()])`, then branch on the results |
| Any DB/network call repeated in a helper that runs on every page/request | Cost multiplies by every navigation | Cache (with a sane TTL + invalidation), batch, or parallelize |

Verified with `npx tsc --noEmit` after both fixes — no type errors.
