-- Add plan expiry tracking to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create payment_history table for tracking all payments
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  payment_id TEXT NOT NULL,
  order_id TEXT,
  razorpay_payment_id TEXT,
  razorpay_signature TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  duration_type TEXT CHECK (duration_type IN ('monthly', 'yearly')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'success', 'failed', 'refunded')),
  payment_method TEXT DEFAULT 'razorpay',
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_history_user_id ON payment_history(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_payment_id ON payment_history(payment_id);
CREATE INDEX IF NOT EXISTS idx_users_plan_expires_at ON users(plan_expires_at);

-- Enable RLS on payment_history
ALTER TABLE payment_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payment_history
CREATE POLICY "Users can view their own payment history"
  ON payment_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "System can insert payment records"
  ON payment_history
  FOR INSERT
  WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE OR REPLACE FUNCTION update_payment_history_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER payment_history_updated_at
  BEFORE UPDATE ON payment_history
  FOR EACH ROW
  EXECUTE FUNCTION update_payment_history_updated_at();

-- Function to check if user's plan has expired and auto-downgrade to free
CREATE OR REPLACE FUNCTION check_and_downgrade_expired_plans()
RETURNS void AS $$
BEGIN
  -- Downgrade users whose plan has expired
  UPDATE users
  SET
    plan = 'free',
    plan_updated_at = NOW()
  WHERE
    plan != 'free'
    AND plan_expires_at IS NOT NULL
    AND plan_expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to run daily (requires pg_cron extension)
-- Note: You need to enable pg_cron extension in Supabase dashboard first
-- Then run this in SQL editor:
-- SELECT cron.schedule(
--   'check-expired-plans',
--   '0 0 * * *', -- Run at midnight every day
--   $$SELECT check_and_downgrade_expired_plans()$$
-- );

-- Comment: To enable automatic plan expiry, go to Supabase Dashboard > Database > Extensions
-- Enable "pg_cron" extension, then run the SELECT cron.schedule command above

-- Trigger to update plan_updated_at when plan changes
CREATE OR REPLACE FUNCTION update_plan_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_plan_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_plan_updated_at();

-- Add comment to explain the automation
COMMENT ON TABLE payment_history IS 'Stores all payment transactions for plan purchases. Automatically populated by Razorpay webhooks.';
COMMENT ON COLUMN users.plan_expires_at IS 'Plan expiration date. When this date passes, user is automatically downgraded to free plan.';
COMMENT ON FUNCTION check_and_downgrade_expired_plans IS 'Automatically downgrades users to free plan when their subscription expires. Should be run daily via pg_cron.';
