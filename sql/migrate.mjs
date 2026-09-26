import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { Client } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const schemaPath = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "schema.sql"
);
const schema = readFileSync(schemaPath, "utf-8");

const client = new Client(databaseUrl);

try {
  await client.connect();
  await client.query(schema);
  console.log("Schema applied successfully.");
} finally {
  await client.end();
}
