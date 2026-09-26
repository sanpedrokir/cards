import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "store.json");

const EMPTY_DB: Database = { investment: null, cards: [] };

// Serializes reads/writes so concurrent Server Action calls don't clobber
// each other's changes to the JSON file.
let writeQueue: Promise<unknown> = Promise.resolve();

async function ensureFile(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify(EMPTY_DB, null, 2));
  }
}

export async function readDb(): Promise<Database> {
  await ensureFile();
  const raw = await fs.readFile(DATA_FILE, "utf-8");
  try {
    const parsed = JSON.parse(raw) as Partial<Database>;
    return {
      investment: parsed.investment ?? null,
      cards: parsed.cards ?? [],
    };
  } catch {
    return structuredClone(EMPTY_DB);
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2));
}

export function mutateDb<T>(
  fn: (db: Database) => T | Promise<T>
): Promise<T> {
  const result = writeQueue.then(async () => {
    const db = await readDb();
    const out = await fn(db);
    await writeDb(db);
    return out;
  });
  writeQueue = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}
