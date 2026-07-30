-- Complete branding table fix
DROP TABLE IF EXISTS branding CASCADE;

CREATE TABLE branding (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  disclaimer_text TEXT DEFAULT 'This is not an offer to enter into an agreement. Not all customers will be approved.',
  equal_housing_text TEXT DEFAULT 'Equal Housing Lender',
  end_card_hold_seconds FLOAT DEFAULT 3.0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- No RLS - simpler for MVP
ALTER TABLE branding DISABLE ROW LEVEL SECURITY;

-- Insert default row
INSERT INTO branding (id, disclaimer_text, equal_housing_text) 
VALUES ('default', 'This is not an offer to enter into an agreement. Not all customers will be approved.', 'Equal Housing Lender');
