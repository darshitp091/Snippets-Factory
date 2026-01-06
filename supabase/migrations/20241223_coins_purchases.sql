-- ============================================================================
-- Coin Purchases Tracking Table
-- ============================================================================
-- Track all coin purchases for accounting and analytics

CREATE TABLE IF NOT EXISTS coin_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id TEXT NOT NULL UNIQUE,
  package_type TEXT NOT NULL CHECK (package_type IN ('small', 'medium', 'large')),
  coins_amount INTEGER NOT NULL,
  price_paid INTEGER NOT NULL, -- in paise (₹)
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  razorpay_signature TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_coin_purchases_user ON coin_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_order ON coin_purchases(order_id);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_status ON coin_purchases(status);
CREATE INDEX IF NOT EXISTS idx_coin_purchases_created ON coin_purchases(created_at DESC);

-- Enable RLS
ALTER TABLE coin_purchases ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own coin purchases"
  ON coin_purchases FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own coin purchases"
  ON coin_purchases FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Function to handle coin purchase completion (called by webhook)
CREATE OR REPLACE FUNCTION complete_coin_purchase(
  p_order_id TEXT,
  p_payment_id TEXT,
  p_signature TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  purchase_record RECORD;
  new_balance INTEGER;
BEGIN
  -- Get purchase record
  SELECT * INTO purchase_record
  FROM coin_purchases
  WHERE order_id = p_order_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Purchase not found for order: %', p_order_id;
  END IF;

  IF purchase_record.status = 'completed' THEN
    RETURN TRUE; -- Already completed
  END IF;

  -- Update purchase record
  UPDATE coin_purchases
  SET
    status = 'completed',
    payment_id = p_payment_id,
    razorpay_signature = p_signature,
    completed_at = NOW()
  WHERE order_id = p_order_id;

  -- Add coins to user account
  INSERT INTO user_coins (user_id, balance, lifetime_purchased)
  VALUES (
    purchase_record.user_id,
    purchase_record.coins_amount,
    purchase_record.coins_amount
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    balance = user_coins.balance + purchase_record.coins_amount,
    lifetime_purchased = user_coins.lifetime_purchased + purchase_record.coins_amount;

  -- Log the transaction
  PERFORM track_usage(
    purchase_record.user_id,
    'coins',
    'purchase',
    purchase_record.coins_amount,
    JSON_BUILD_OBJECT(
      'order_id', p_order_id,
      'package_type', purchase_record.package_type,
      'price_paid', purchase_record.price_paid
    )
  );

  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION complete_coin_purchase(TEXT, TEXT, TEXT) TO anon, authenticated;
