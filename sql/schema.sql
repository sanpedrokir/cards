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
ALTER TABLE investment DROP CONSTRAINT IF EXISTS investment_pkey;
ALTER TABLE investment DROP COLUMN IF EXISTS id;
ALTER TABLE investment ADD COLUMN IF NOT EXISTS user_id TEXT PRIMARY KEY;
ALTER TABLE cards ADD COLUMN IF NOT EXISTS user_id TEXT NOT NULL;

CREATE INDEX IF NOT EXISTS cards_user_id_idx ON cards (user_id);
