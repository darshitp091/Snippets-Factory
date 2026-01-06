-- ============================================================================
-- Subscription Expiry Automation (CORRECTED VERSION)
-- ============================================================================
-- This migration sets up automatic subscription expiry checking
-- Version: 2.0 (Fixed)
-- Date: 2024-12-23
--
-- IMPORTANT: Run AFTER the critical_security_fixes migration
-- ============================================================================

-- ============================================================================
-- 1. SUBSCRIPTION LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscription_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('downgrade', 'upgrade', 'renew', 'cancel', 'expire')),
  old_plan TEXT,
  new_plan TEXT,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  performed_by TEXT DEFAULT 'system',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_subscription_logs_user ON subscription_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_logs_created ON subscription_logs(created_at DESC);

ALTER TABLE subscription_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription logs"
  ON subscription_logs FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. CHECK AND DOWNGRADE EXPIRED PLANS (Definitive Version)
-- ============================================================================

-- Drop existing version if it exists (from critical_security_fixes)
DROP FUNCTION IF EXISTS check_and_downgrade_expired_plans() CASCADE;

-- Create the proper version with logging
CREATE OR REPLACE FUNCTION check_and_downgrade_expired_plans()
RETURNS TABLE (
  user_id UUID,
  old_plan TEXT,
  action TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH expired_users AS (
    SELECT
      id,
      plan,
      subscription_expires_at
    FROM users
    WHERE
      plan != 'free'
      AND subscription_expires_at IS NOT NULL
      AND subscription_expires_at <= NOW()
      AND subscription_status = 'active'
  ),
  downgraded AS (
    UPDATE users u
    SET
      plan = 'free',
      subscription_status = 'expired',
      max_snippets = 10,  -- Free tier limit
      max_team_members = 0,
      updated_at = NOW()
    FROM expired_users e
    WHERE u.id = e.id
    RETURNING u.id, e.plan as old_plan
  ),
  logged AS (
    INSERT INTO subscription_logs (user_id, action, old_plan, new_plan, old_status, new_status, reason)
    SELECT
      d.id,
      'expire'::TEXT,
      d.old_plan,
      'free'::TEXT,
      'active'::TEXT,
      'expired'::TEXT,
      'Subscription expired on ' || e.subscription_expires_at::TEXT
    FROM downgraded d
    JOIN expired_users e ON d.id = e.id
    RETURNING user_id, old_plan
  )
  SELECT
    l.user_id,
    l.old_plan,
    'downgraded_to_free'::TEXT as action
  FROM logged l;
END;
$$;

-- ============================================================================
-- 3. CRON JOB API ENDPOINT FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION run_subscription_expiry_check(
  p_api_key TEXT DEFAULT NULL
)
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result_count INTEGER := 0;
  downgraded_users JSON;
BEGIN
  -- Note: API key validation happens in the API endpoint, not here
  -- This allows the function to also be called internally

  -- Run the expiry check and get results
  SELECT JSON_AGG(row_to_json(t))
  INTO downgraded_users
  FROM check_and_downgrade_expired_plans() t;

  -- Get count
  GET DIAGNOSTICS result_count = ROW_COUNT;

  RETURN JSON_BUILD_OBJECT(
    'success', true,
    'downgraded_count', result_count,
    'users', downgraded_users,
    'timestamp', NOW()
  );
END;
$$;

-- ============================================================================
-- 4. EXPIRY NOTIFICATIONS FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION send_expiry_notifications()
RETURNS TABLE (
  user_id UUID,
  email TEXT,
  plan TEXT,
  expires_at TIMESTAMPTZ,
  days_until_expiry INTEGER
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.email,
    u.plan,
    u.subscription_expires_at,
    EXTRACT(DAY FROM u.subscription_expires_at - NOW())::INTEGER as days_until_expiry
  FROM users u
  WHERE
    u.subscription_expires_at IS NOT NULL
    AND u.subscription_expires_at > NOW()
    AND u.subscription_expires_at <= NOW() + INTERVAL '7 days'
    AND u.plan != 'free'
    AND u.subscription_status = 'active'
  ORDER BY u.subscription_expires_at ASC;
END;
$$;

-- ============================================================================
-- 5. RENEW SUBSCRIPTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION renew_subscription(
  p_user_id UUID,
  p_subscription_id TEXT,
  p_plan TEXT,
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  old_plan TEXT;
  old_status TEXT;
  max_snippets_val INTEGER;
  max_team_val INTEGER;
  max_collections_val INTEGER;
BEGIN
  -- Get current plan
  SELECT plan, subscription_status
  INTO old_plan, old_status
  FROM users
  WHERE id = p_user_id;

  -- Set limits based on new plan
  CASE p_plan
    WHEN 'basic' THEN
      max_snippets_val := 50;
      max_team_val := 0;
      max_collections_val := 5;
    WHEN 'pro' THEN
      max_snippets_val := -1;  -- Unlimited
      max_team_val := 5;
      max_collections_val := -1;
    WHEN 'enterprise' THEN
      max_snippets_val := -1;  -- Unlimited
      max_team_val := -1;  -- Unlimited
      max_collections_val := -1;
    ELSE
      max_snippets_val := 10;
      max_team_val := 0;
      max_collections_val := 1;
  END CASE;

  -- Update user
  UPDATE users
  SET
    plan = p_plan,
    subscription_id = p_subscription_id,
    subscription_status = 'active',
    subscription_expires_at = p_expires_at,
    max_snippets = max_snippets_val,
    max_team_members = max_team_val,
    max_collections = max_collections_val,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the renewal
  INSERT INTO subscription_logs (
    user_id,
    action,
    old_plan,
    new_plan,
    old_status,
    new_status,
    reason,
    performed_by,
    metadata
  ) VALUES (
    p_user_id,
    'renew',
    old_plan,
    p_plan,
    old_status,
    'active',
    'Subscription renewed until ' || p_expires_at::TEXT,
    'razorpay_webhook',
    JSON_BUILD_OBJECT('subscription_id', p_subscription_id)
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- 6. CANCEL SUBSCRIPTION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION cancel_subscription(
  p_user_id UUID,
  p_reason TEXT DEFAULT 'User cancelled'
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_plan TEXT;
BEGIN
  -- Get current plan
  SELECT plan INTO current_plan
  FROM users
  WHERE id = p_user_id;

  -- Update subscription status (keep plan until expiry)
  UPDATE users
  SET
    subscription_status = 'cancelled',
    auto_renew = false,
    updated_at = NOW()
  WHERE id = p_user_id;

  -- Log the cancellation
  INSERT INTO subscription_logs (
    user_id,
    action,
    old_plan,
    new_plan,
    old_status,
    new_status,
    reason,
    performed_by
  ) VALUES (
    p_user_id,
    'cancel',
    current_plan,
    current_plan,
    'active',
    'cancelled',
    p_reason,
    'user'
  );

  RETURN TRUE;
END;
$$;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION run_subscription_expiry_check(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION send_expiry_notifications() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION renew_subscription(UUID, TEXT, TEXT, TIMESTAMPTZ) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION cancel_subscription(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_and_downgrade_expired_plans() TO anon, authenticated;
