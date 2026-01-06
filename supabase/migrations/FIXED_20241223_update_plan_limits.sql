-- ============================================================================
-- Update Plan Limits - New Pricing Model (CORRECTED VERSION)
-- ============================================================================
-- Updates default limits for all plans based on new competitive pricing
-- Version: 2.0 (Fixed)
-- Date: 2024-12-23
--
-- IMPORTANT: Run AFTER critical_security_fixes and subscription_automation
-- ============================================================================

-- NOTE: Columns are already added in critical_security_fixes migration
-- This migration just UPDATES the values based on new pricing model

-- ============================================================================
-- 1. UPDATE DEFAULT COLUMN VALUES
-- ============================================================================

ALTER TABLE users
ALTER COLUMN max_snippets SET DEFAULT 10,  -- Free tier reduced to 10
ALTER COLUMN max_team_members SET DEFAULT 0,
ALTER COLUMN max_collections SET DEFAULT 1;

-- ============================================================================
-- 2. ADD NEW COLUMNS FOR AI AND API USAGE
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS ai_generations_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ai_generations_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_per_month INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS api_calls_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit_mb INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS storage_used_mb INTEGER DEFAULT 0;

-- ============================================================================
-- 3. UPDATE EXISTING USERS TO NEW LIMITS
-- ============================================================================

UPDATE users
SET
  max_snippets = CASE
    WHEN plan = 'free' THEN 10
    WHEN plan = 'basic' THEN 50
    WHEN plan = 'pro' THEN -1  -- Unlimited
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 10
  END,
  max_team_members = CASE
    WHEN plan = 'free' THEN 0
    WHEN plan = 'basic' THEN 0
    WHEN plan = 'pro' THEN 5
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 0
  END,
  max_collections = CASE
    WHEN plan = 'free' THEN 1
    WHEN plan = 'basic' THEN 5
    WHEN plan = 'pro' THEN -1  -- Unlimited
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 1
  END,
  ai_generations_per_month = CASE
    WHEN plan = 'free' THEN 0
    WHEN plan = 'basic' THEN 0
    WHEN plan = 'pro' THEN 100
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 0
  END,
  api_calls_per_month = CASE
    WHEN plan = 'free' THEN 0
    WHEN plan = 'basic' THEN 0
    WHEN plan = 'pro' THEN 1000
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 0
  END,
  storage_limit_mb = CASE
    WHEN plan = 'free' THEN 100
    WHEN plan = 'basic' THEN 1000  -- 1GB
    WHEN plan = 'pro' THEN 10000  -- 10GB
    WHEN plan = 'enterprise' THEN -1  -- Unlimited
    ELSE 100
  END,
  updated_at = NOW()
WHERE TRUE;

-- ============================================================================
-- 4. MONTHLY USAGE RESET FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION reset_monthly_usage()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Reset AI generation and API call counters
  UPDATE users
  SET
    ai_generations_used = 0,
    api_calls_used = 0
  WHERE plan != 'free';

  -- Log the reset
  INSERT INTO usage_tracking (user_id, feature, usage_type, quantity, metadata)
  SELECT
    id,
    'system',
    'monthly_reset',
    1,
    JSON_BUILD_OBJECT('reset_date', NOW())
  FROM users
  WHERE plan != 'free';
END;
$$;

-- ============================================================================
-- 5. CHECK AI GENERATION LIMIT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_ai_generation_limit(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_plan TEXT;
  monthly_limit INTEGER;
  used_count INTEGER;
BEGIN
  SELECT
    plan,
    ai_generations_per_month,
    ai_generations_used
  INTO user_plan, monthly_limit, used_count
  FROM users
  WHERE id = p_user_id;

  -- Unlimited (-1)
  IF monthly_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- No access (0)
  IF monthly_limit = 0 THEN
    RETURN FALSE;
  END IF;

  -- Check if under limit
  IF used_count < monthly_limit THEN
    -- Increment counter
    UPDATE users
    SET ai_generations_used = ai_generations_used + 1
    WHERE id = p_user_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================================================
-- 6. CHECK API CALL LIMIT
-- ============================================================================

CREATE OR REPLACE FUNCTION check_api_call_limit(p_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_plan TEXT;
  monthly_limit INTEGER;
  used_count INTEGER;
BEGIN
  SELECT
    plan,
    api_calls_per_month,
    api_calls_used
  INTO user_plan, monthly_limit, used_count
  FROM users
  WHERE id = p_user_id;

  -- Unlimited (-1)
  IF monthly_limit = -1 THEN
    RETURN TRUE;
  END IF;

  -- No access (0)
  IF monthly_limit = 0 THEN
    RETURN FALSE;
  END IF;

  -- Check if under limit
  IF used_count < monthly_limit THEN
    -- Increment counter
    UPDATE users
    SET api_calls_used = api_calls_used + 1
    WHERE id = p_user_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- ============================================================================
-- 7. UPDATE user_has_feature FUNCTION (Enhanced)
-- ============================================================================

CREATE OR REPLACE FUNCTION user_has_feature(
  p_user_id UUID,
  p_feature TEXT
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_plan TEXT;
BEGIN
  SELECT plan INTO user_plan
  FROM users
  WHERE id = p_user_id;

  RETURN CASE
    -- Analytics: Pro and Enterprise only
    WHEN p_feature = 'analytics' THEN user_plan IN ('pro', 'enterprise')

    -- Team Management: Pro and Enterprise only
    WHEN p_feature = 'team_management' THEN user_plan IN ('pro', 'enterprise')

    -- AI Generation: Pro and Enterprise only
    WHEN p_feature = 'ai_generation' THEN user_plan IN ('pro', 'enterprise')

    -- Advanced Export: Basic, Pro, and Enterprise
    WHEN p_feature = 'advanced_export' THEN user_plan IN ('basic', 'pro', 'enterprise')

    -- API Access: Pro and Enterprise only
    WHEN p_feature = 'api_access' THEN user_plan IN ('pro', 'enterprise')

    -- Version History: Pro and Enterprise only
    WHEN p_feature = 'version_history' THEN user_plan IN ('pro', 'enterprise')

    -- Priority Support: Pro and Enterprise only
    WHEN p_feature = 'priority_support' THEN user_plan IN ('pro', 'enterprise')

    -- SSO: Enterprise only
    WHEN p_feature = 'sso' THEN user_plan = 'enterprise'

    -- White Label: Enterprise only
    WHEN p_feature = 'white_label' THEN user_plan = 'enterprise'

    -- Audit Logs: Enterprise only
    WHEN p_feature = 'audit_logs' THEN user_plan = 'enterprise'

    -- No Ads: Basic, Pro, and Enterprise (Free users see ads)
    WHEN p_feature = 'no_ads' THEN user_plan IN ('basic', 'pro', 'enterprise')

    ELSE FALSE
  END;
END;
$$;

-- ============================================================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_plan ON users(plan);
CREATE INDEX IF NOT EXISTS idx_users_ai_usage ON users(ai_generations_used) WHERE plan != 'free';
CREATE INDEX IF NOT EXISTS idx_users_api_usage ON users(api_calls_used) WHERE plan != 'free';
CREATE INDEX IF NOT EXISTS idx_users_subscription_expires ON users(subscription_expires_at) WHERE subscription_expires_at IS NOT NULL;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION reset_monthly_usage() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_ai_generation_limit(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_api_call_limit(UUID) TO anon, authenticated;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Verify the updates
SELECT
  plan,
  COUNT(*) as user_count,
  MAX(max_snippets) as max_snippets,
  MAX(max_team_members) as max_team,
  MAX(max_collections) as max_collections,
  MAX(ai_generations_per_month) as ai_limit,
  MAX(api_calls_per_month) as api_limit
FROM users
GROUP BY plan
ORDER BY
  CASE plan
    WHEN 'free' THEN 1
    WHEN 'basic' THEN 2
    WHEN 'pro' THEN 3
    WHEN 'enterprise' THEN 4
    ELSE 5
  END;
