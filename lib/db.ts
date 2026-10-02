import "server-only";
import { neon, Pool } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set.");
}

export const sql = neon(process.env.DATABASE_URL);

// Reuse one connection pool across requests (and across hot-reloads in dev)
// instead of opening a fresh TCP+TLS connection per transactional query.
const globalForPool = globalThis as unknown as { __neonPool?: Pool };

export const pool =
  globalForPool.__neonPool ??
  (globalForPool.__neonPool = new Pool({ connectionString: process.env.DATABASE_URL }));
