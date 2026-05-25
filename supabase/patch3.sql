-- Add columns needed for Pesapal payments
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS reference text;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS order_tracking_id text;
ALTER TABLE payment_requests ADD COLUMN IF NOT EXISTS updated_at timestamptz default now();

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_payment_tracking ON payment_requests(order_tracking_id);
CREATE INDEX IF NOT EXISTS idx_payment_reference ON payment_requests(reference);
