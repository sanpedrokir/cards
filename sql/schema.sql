-- Card Business Investment & Sales Tracker schema

CREATE TABLE IF NOT EXISTS investment (
  user_id TEXT PRIMARY KEY,
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  investment_date DATE NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  purchase_price NUMERIC(14, 2) NOT NULL,
  purchase_date DATE NOT NULL,
  category TEXT,
  series TEXT,
  card_number TEXT,
  grade TEXT,
  grading_company TEXT,
  quantity INTEGER,
  notes TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold')),
  sale_price NUMERIC(14, 2),
  sale_date DATE,
  buyer TEXT,
  channel TEXT,
  fees NUMERIC(14, 2),
  sale_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS cards_status_idx ON cards (status);
CREATE INDEX IF NOT EXISTS cards_created_at_idx ON cards (created_at DESC);

ALTER TABLE cards ADD COLUMN IF NOT EXISTS cert_number TEXT;

-- Multi-user support: scope investment/cards per Clerk user
ALTER TABLE investment DROP CONSTRAINT IF EXISTS investment_id_check;
ALTER TABLE investment DROP COLUMN IF EXISTS id;
ALTER TABLE investment ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE investment ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL;

CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards (user_id);

-- Collections: each user can have many; every card and every budget
-- (investment row) belongs to exactly one. The investment table used to be
-- one row per user (PRIMARY KEY (user_id)); it's now one row per collection.
-- collection_id stays nullable so rows created before collections existed are
-- adopted into a user's first ("My Collection") collection the next time
-- they're seen (see ensureCollections in lib/store.ts, or run
-- sql/migrate-collections.mjs to adopt them all up front).
CREATE TABLE IF NOT EXISTS collections (
  id UUID PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections (user_id);

-- Optional picture shown in place of the collection's letter avatar.
ALTER TABLE collections ADD COLUMN IF NOT EXISTS icon_url TEXT;

ALTER TABLE cards ADD COLUMN IF NOT EXISTS collection_id UUID;
CREATE INDEX IF NOT EXISTS cards_collection_id_idx ON cards (collection_id);

-- Small (~360px) copy of the card photo for grids/lists; image_url keeps the
-- larger one for the detail page and zoom.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS thumb_url TEXT;

ALTER TABLE investment ADD COLUMN IF NOT EXISTS collection_id UUID;
ALTER TABLE investment DROP CONSTRAINT IF EXISTS investment_pkey;
CREATE UNIQUE INDEX IF NOT EXISTS investment_collection_id_key ON investment (collection_id);
CREATE INDEX IF NOT EXISTS investment_user_id_idx ON investment (user_id);

-- Direct Stripe subscription billing (not Clerk Billing)
CREATE TABLE IF NOT EXISTS subscriptions (
  user_id TEXT PRIMARY KEY,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'incomplete',
  current_period_end TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ;

-- Single-row app-wide settings, toggled from /admin
CREATE TABLE IF NOT EXISTS app_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  subscription_required BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO app_settings (id, subscription_required)
VALUES (1, false)
ON CONFLICT (id) DO NOTHING;

-- Optional user-entered estimated market worth of a card (per card).
ALTER TABLE cards ADD COLUMN IF NOT EXISTS estimated_value NUMERIC(14, 2);

-- When the card's estimated worth was last checked against eBay.
ALTER TABLE cards ADD COLUMN IF NOT EXISTS estimated_at TIMESTAMPTZ;
