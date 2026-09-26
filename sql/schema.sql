-- Card Business Investment & Sales Tracker schema

CREATE TABLE IF NOT EXISTS investment (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  amount NUMERIC(14, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'SGD',
  investment_date DATE NOT NULL,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY,
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
