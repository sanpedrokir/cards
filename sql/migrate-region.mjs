import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { neon, Client } from "@neondatabase/serverless";

const oldUrl = process.env.DATABASE_URL;
const newUrl = process.env.NEW_DATABASE_URL;

if (!oldUrl || !newUrl) {
  console.error("Both DATABASE_URL (old) and NEW_DATABASE_URL (new) must be set.");
  process.exit(1);
}

const schemaPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "schema.sql"
);
const schema = readFileSync(schemaPath, "utf-8");

const oldSql = neon(oldUrl);
const newSql = neon(newUrl);

const BATCH_SIZE = 5;

async function copyTable(table, columns, orderBy) {
  const countRows = await oldSql.query(`SELECT count(*) FROM ${table}`);
  const total = Number(countRows[0].count);
  console.log(`${table}: ${total} row(s) total`);

  let copied = 0;
  for (let offset = 0; offset < total; offset += BATCH_SIZE) {
    const rows = await oldSql.query(
      `SELECT ${columns.join(", ")} FROM ${table} ORDER BY ${orderBy} LIMIT ${BATCH_SIZE} OFFSET ${offset}`
    );

    for (const row of rows) {
      const values = columns.map((c) => row[c]);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(", ");
      await newSql.query(
        `INSERT INTO ${table} (${columns.join(", ")}) VALUES (${placeholders})
         ON CONFLICT DO NOTHING`,
        values
      );
      copied++;
    }
    console.log(`${table}: copied ${copied}/${total}`);
  }
  return copied;
}

const schemaClient = new Client(newUrl);
await schemaClient.connect();
await schemaClient.query(schema);
await schemaClient.end();
console.log("Schema applied to new database.");

const counts = {};
counts.investment = await copyTable("investment", [
  "user_id",
  "amount",
  "currency",
  "investment_date",
  "notes",
], "user_id");

counts.cards = await copyTable("cards", [
  "id",
  "user_id",
  "name",
  "purchase_price",
  "purchase_date",
  "category",
  "series",
  "card_number",
  "grade",
  "grading_company",
  "cert_number",
  "quantity",
  "notes",
  "image_url",
  "status",
  "sale_price",
  "sale_date",
  "buyer",
  "channel",
  "fees",
  "sale_notes",
  "created_at",
], "id");

counts.subscriptions = await copyTable("subscriptions", [
  "user_id",
  "stripe_customer_id",
  "stripe_subscription_id",
  "status",
  "current_period_end",
  "updated_at",
  "created_at",
  "last_event_at",
], "user_id");

counts.app_settings = await copyTable("app_settings", [
  "id",
  "subscription_required",
], "id");

console.log("Copy complete:", counts);

for (const table of ["investment", "cards", "subscriptions", "app_settings"]) {
  const rows = await newSql.query(`SELECT count(*) FROM ${table}`);
  console.log(`New DB ${table} count:`, rows[0].count);
}
