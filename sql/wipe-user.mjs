import { Client } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node --env-file=.env.local sql/wipe-user.mjs <clerk-user-id>");
  process.exit(1);
}

const client = new Client(databaseUrl);

try {
  await client.connect();
  const cards = await client.query("DELETE FROM cards WHERE user_id = $1", [userId]);
  const investment = await client.query("DELETE FROM investment WHERE user_id = $1", [userId]);
  const subscriptions = await client.query("DELETE FROM subscriptions WHERE user_id = $1", [userId]);
  console.log(
    `Deleted for ${userId}: ${cards.rowCount} card(s), ${investment.rowCount} investment row(s), ${subscriptions.rowCount} subscription row(s).`
  );
} finally {
  await client.end();
}
