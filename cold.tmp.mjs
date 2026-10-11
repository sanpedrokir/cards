import { neon } from "@neondatabase/serverless";
const idleMs = 7 * 60 * 1000;
console.log("idling", idleMs / 60000, "minutes...");
await new Promise((r) => setTimeout(r, idleMs));
const sql = neon(process.env.DATABASE_URL);
for (let i = 1; i <= 4; i++) {
  const s = performance.now();
  await sql`SELECT 1`;
  console.log(`query ${i}: ${Math.round(performance.now() - s)}ms`);
}
