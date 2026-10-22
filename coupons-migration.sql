-- Coupon system: NEW tables only. No existing table or column is touched.
-- Idempotent - safe to run more than once. Run in the Supabase SQL editor.

CREATE TABLE IF NOT EXISTS coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value > 0),
  min_order_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  max_discount_amount NUMERIC(10,2),
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  start_timezone TEXT,
  end_timezone TEXT,
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit >= 1),
  per_customer_limit INTEGER CHECK (per_customer_limit IS NULL OR per_customer_limit >= 1),
  used_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Codes are case-insensitive.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_code_upper ON coupons (upper(code));

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
  order_id TEXT,
  order_number TEXT,
  email TEXT,
  discount_amount NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon ON coupon_redemptions (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_email ON coupon_redemptions (coupon_id, lower(email));
-- One redemption per (coupon, payment session): the webhook and the status
-- poll can both finish the same order, and the second insert is then ignored.
CREATE UNIQUE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_order ON coupon_redemptions (coupon_id, order_id);

-- Atomic claim/release of one use. A single UPDATE, so two customers can't
-- both take the last use. Callable ONLY by the server (service role): the
-- public/anon key must never be able to burn a coupon's uses.
CREATE OR REPLACE FUNCTION claim_coupon(p_id UUID) RETURNS BOOLEAN
LANGUAGE sql AS $$
  WITH u AS (
    UPDATE coupons
       SET used_count = used_count + 1, updated_at = NOW()
     WHERE id = p_id
       AND is_active
       AND (usage_limit IS NULL OR used_count < usage_limit)
    RETURNING 1
  )
  SELECT EXISTS (SELECT 1 FROM u);
$$;

CREATE OR REPLACE FUNCTION release_coupon(p_id UUID) RETURNS VOID
LANGUAGE sql AS $$
  UPDATE coupons SET used_count = GREATEST(used_count - 1, 0), updated_at = NOW() WHERE id = p_id;
$$;

REVOKE ALL ON FUNCTION claim_coupon(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION release_coupon(UUID) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_coupon(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION release_coupon(UUID) TO service_role;

-- Row-level security ON with NO policies: only the server (service role)
-- can read or write, so visitors can never list or probe codes.
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;
