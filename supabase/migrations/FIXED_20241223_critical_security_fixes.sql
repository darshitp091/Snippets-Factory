-- ============================================================================
-- CRITICAL SECURITY FIXES - Snippet Factory (CORRECTED VERSION)
-- ============================================================================
-- Fixes major security vulnerabilities and business logic gaps
-- Version: 2.0 (Fixed)
-- Date: 2024-12-23
--
-- IMPORTANT: This is the corrected version that fixes column references
-- ============================================================================

-- ============================================================================
-- 1. ADD MISSING COLUMNS TO USERS TABLE (MUST BE FIRST!)
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS snippet_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_snippets INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS max_team_members INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_collections INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS team_member_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS plan_updated_at TIMESTAMPTZ;

-- ============================================================================
-- 2. FIX SNIPPET COUNT TRACKING
-- ============================================================================

-- Increment snippet count when snippet is created
CREATE OR REPLACE FUNCTION increment_user_snippet_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET
    snippet_count = snippet_count + 1,
    updated_at = NOW()
  WHERE id = NEW.created_by;

  RETURN NEW;
END;
$$;

-- Decrement snippet count when snippet is deleted
CREATE OR REPLACE FUNCTION decrement_user_snippet_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE users
  SET
    snippet_count = GREATEST(0, snippet_count - 1),
    updated_at = NOW()
  WHERE id = OLD.created_by;

  RETURN OLD;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_increment_snippet_count ON snippets;
CREATE TRIGGER trigger_increment_snippet_count
  AFTER INSERT ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION increment_user_snippet_count();

DROP TRIGGER IF EXISTS trigger_decrement_snippet_count ON snippets;
CREATE TRIGGER trigger_decrement_snippet_count
  AFTER DELETE ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION decrement_user_snippet_count();

-- Backfill existing snippet counts
UPDATE users u
SET snippet_count = (
  SELECT COUNT(*)
  FROM snippets s
  WHERE s.created_by = u.id
)
WHERE EXISTS (
  SELECT 1 FROM snippets WHERE created_by = u.id
);

-- ============================================================================
-- 3. ADD PLAN VERIFICATION FUNCTION
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
    -- Free plan features
    WHEN p_feature = 'basic_snippets' THEN TRUE
    WHEN p_feature = 'public_sharing' THEN TRUE
    WHEN p_feature = 'communities' THEN TRUE

    -- Basic plan features (new tier)
    WHEN p_feature = 'no_ads' THEN user_plan IN ('basic', 'pro', 'enterprise')
    WHEN p_feature = 'advanced_export' THEN user_plan IN ('basic', 'pro', 'enterprise')

    -- Pro plan features
    WHEN p_feature = 'analytics' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'team_management' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'api_access' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'ai_generation' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'advanced_search' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'priority_support' THEN user_plan IN ('pro', 'enterprise')
    WHEN p_feature = 'version_history' THEN user_plan IN ('pro', 'enterprise')

    -- Enterprise plan features
    WHEN p_feature = 'sso' THEN user_plan = 'enterprise'
    WHEN p_feature = 'white_label' THEN user_plan = 'enterprise'
    WHEN p_feature = 'custom_branding' THEN user_plan = 'enterprise'
    WHEN p_feature = 'audit_logs' THEN user_plan = 'enterprise'
    WHEN p_feature = 'unlimited_teams' THEN user_plan = 'enterprise'

    ELSE FALSE
  END;
END;
$$;

-- ============================================================================
-- 4. ADD USAGE TRACKING TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  usage_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_usage_tracking_user ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_date ON usage_tracking(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_feature ON usage_tracking(feature);

ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Function to track usage
CREATE OR REPLACE FUNCTION track_usage(
  p_user_id UUID,
  p_feature TEXT,
  p_usage_type TEXT,
  p_quantity INTEGER DEFAULT 1,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO usage_tracking (user_id, feature, usage_type, quantity, metadata)
  VALUES (p_user_id, p_feature, p_usage_type, p_quantity, p_metadata);
END;
$$;

-- ============================================================================
-- 5. ADD SUBSCRIPTION MANAGEMENT FIELDS
-- ============================================================================

ALTER TABLE users
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive'
  CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'expired')),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_renew BOOLEAN DEFAULT TRUE;

-- NOTE: We will NOT define check_and_downgrade_expired_plans() here
-- It will be defined properly in the subscription_automation migration

-- ============================================================================
-- 6. ADD TEAM MEMBER TRACKING (FIXED - tracks on users table)
-- ============================================================================

-- Increment team member count for team OWNER
CREATE OR REPLACE FUNCTION increment_team_member_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  owner_id UUID;
BEGIN
  -- Get the team owner from team_members table
  -- Assuming team_owner_id column exists in team_members
  -- If not, we need to join with teams table
  SELECT team_owner_id INTO owner_id
  FROM team_members
  WHERE id = NEW.id;

  -- If team_owner_id doesn't exist in team_members, get from teams table
  IF owner_id IS NULL THEN
    SELECT owner_id INTO owner_id
    FROM teams
    WHERE id = NEW.team_id;
  END IF;

  -- Increment the owner's team member count
  UPDATE users
  SET
    team_member_count = team_member_count + 1,
    updated_at = NOW()
  WHERE id = owner_id;

  RETURN NEW;
END;
$$;

-- Decrement team member count for team OWNER
CREATE OR REPLACE FUNCTION decrement_team_member_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  owner_id UUID;
BEGIN
  -- Get the team owner
  SELECT team_owner_id INTO owner_id
  FROM team_members
  WHERE id = OLD.id;

  IF owner_id IS NULL THEN
    SELECT owner_id INTO owner_id
    FROM teams
    WHERE id = OLD.team_id;
  END IF;

  -- Decrement the owner's team member count
  UPDATE users
  SET
    team_member_count = GREATEST(0, team_member_count - 1),
    updated_at = NOW()
  WHERE id = owner_id;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trigger_increment_team_members ON team_members;
CREATE TRIGGER trigger_increment_team_members
  AFTER INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION increment_team_member_count();

DROP TRIGGER IF EXISTS trigger_decrement_team_members ON team_members;
CREATE TRIGGER trigger_decrement_team_members
  AFTER DELETE ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION decrement_team_member_count();

-- ============================================================================
-- 7. SNIPPET LIMIT ENFORCEMENT
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_snippet_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_plan TEXT;
  max_snippets_limit INTEGER;
  current_count INTEGER;
BEGIN
  -- Get user's plan and limits
  SELECT plan, snippet_count, max_snippets
  INTO user_plan, current_count, max_snippets_limit
  FROM users
  WHERE id = NEW.created_by;

  -- Check if limit is reached (max_snippets = -1 means unlimited)
  IF max_snippets_limit != -1 AND current_count >= max_snippets_limit THEN
    RAISE EXCEPTION 'Snippet limit reached. Current: %, Max: %. Upgrade your plan for more snippets.',
      current_count, max_snippets_limit
    USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_snippet_limit ON snippets;
CREATE TRIGGER trigger_enforce_snippet_limit
  BEFORE INSERT ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION enforce_snippet_limit();

-- ============================================================================
-- 8. TEAM MEMBER LIMIT ENFORCEMENT (FIXED - checks users table)
-- ============================================================================

CREATE OR REPLACE FUNCTION enforce_team_member_limit()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  owner_id UUID;
  owner_max_members INTEGER;
  owner_current_count INTEGER;
  owner_plan TEXT;
BEGIN
  -- Get team owner from team_members or teams table
  SELECT team_owner_id INTO owner_id
  FROM team_members
  WHERE id = NEW.id;

  IF owner_id IS NULL THEN
    SELECT owner_id INTO owner_id
    FROM teams
    WHERE id = NEW.team_id;
  END IF;

  -- Get owner's limits from users table
  SELECT max_team_members, team_member_count, plan
  INTO owner_max_members, owner_current_count, owner_plan
  FROM users
  WHERE id = owner_id;

  -- Check if limit is reached (max_team_members = -1 means unlimited)
  IF owner_max_members != -1 AND owner_current_count >= owner_max_members THEN
    RAISE EXCEPTION 'Team member limit reached. Current: %, Max: %. Upgrade to add more team members.',
      owner_current_count, owner_max_members
    USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_enforce_team_member_limit ON team_members;
CREATE TRIGGER trigger_enforce_team_member_limit
  BEFORE INSERT ON team_members
  FOR EACH ROW
  EXECUTE FUNCTION enforce_team_member_limit();

-- ============================================================================
-- 9. COINS/AWARDS SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_coins (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  lifetime_purchased INTEGER DEFAULT 0,
  lifetime_spent INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS award_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon_url TEXT,
  coin_cost INTEGER NOT NULL CHECK (coin_cost > 0),
  gives_premium_days INTEGER DEFAULT 0,
  gives_coins INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE TABLE IF NOT EXISTS snippet_awards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES snippets(id) ON DELETE CASCADE,
  award_type_id UUID NOT NULL REFERENCES award_types(id),
  given_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  given_to UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_snippet_awards_snippet ON snippet_awards(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_awards_recipient ON snippet_awards(given_to);

ALTER TABLE user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE award_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippet_awards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own coins"
  ON user_coins FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Everyone can view award types"
  ON award_types FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Users can view awards"
  ON snippet_awards FOR SELECT
  USING (TRUE);

-- Function to give an award
CREATE OR REPLACE FUNCTION give_award(
  p_snippet_id UUID,
  p_award_type_id UUID,
  p_given_by UUID,
  p_message TEXT DEFAULT NULL,
  p_is_anonymous BOOLEAN DEFAULT FALSE
)
RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  award_cost INTEGER;
  giver_balance INTEGER;
  recipient_id UUID;
  award_gives_coins INTEGER;
  award_gives_premium INTEGER;
  award_id UUID;
BEGIN
  -- Get award cost and benefits
  SELECT coin_cost, gives_coins, gives_premium_days
  INTO award_cost, award_gives_coins, award_gives_premium
  FROM award_types
  WHERE id = p_award_type_id AND is_active = TRUE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Award type not found or inactive';
  END IF;

  -- Get giver's balance
  SELECT balance INTO giver_balance
  FROM user_coins
  WHERE user_id = p_given_by;

  IF giver_balance < award_cost THEN
    RAISE EXCEPTION 'Insufficient coins. Required: %, Balance: %', award_cost, giver_balance;
  END IF;

  -- Get recipient
  SELECT created_by INTO recipient_id
  FROM snippets
  WHERE id = p_snippet_id;

  -- Deduct coins from giver
  UPDATE user_coins
  SET
    balance = balance - award_cost,
    lifetime_spent = lifetime_spent + award_cost,
    updated_at = NOW()
  WHERE user_id = p_given_by;

  -- Create award record
  INSERT INTO snippet_awards (snippet_id, award_type_id, given_by, given_to, message, is_anonymous)
  VALUES (p_snippet_id, p_award_type_id, p_given_by, recipient_id, p_message, p_is_anonymous)
  RETURNING id INTO award_id;

  -- Give benefits to recipient
  IF award_gives_coins > 0 THEN
    INSERT INTO user_coins (user_id, balance)
    VALUES (recipient_id, award_gives_coins)
    ON CONFLICT (user_id) DO UPDATE
    SET balance = user_coins.balance + award_gives_coins;
  END IF;

  IF award_gives_premium > 0 THEN
    UPDATE users
    SET
      plan = CASE WHEN plan = 'free' THEN 'pro' ELSE plan END,
      plan_expires_at = COALESCE(plan_expires_at, NOW()) + (award_gives_premium || ' days')::INTERVAL,
      subscription_expires_at = COALESCE(subscription_expires_at, NOW()) + (award_gives_premium || ' days')::INTERVAL
    WHERE id = recipient_id;
  END IF;

  RETURN award_id;
END;
$$;

-- Insert default award types
INSERT INTO award_types (name, description, coin_cost, gives_premium_days, gives_coins) VALUES
  ('Silver', 'Show appreciation for this snippet', 100, 0, 0),
  ('Gold', 'Give a week of Pro and 100 coins', 500, 7, 100),
  ('Platinum', 'Give a month of Pro and 700 coins', 1800, 30, 700),
  ('Code Master', 'Recognize exceptional code quality', 300, 0, 0),
  ('Helpful', 'This snippet solved my problem', 150, 0, 0)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 10. API KEYS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  rate_limit_per_hour INTEGER DEFAULT 100,
  CONSTRAINT valid_expiry CHECK (expires_at IS NULL OR expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFICATION FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION verify_security_fixes()
RETURNS JSON
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT JSON_BUILD_OBJECT(
    'snippet_count_trigger', EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_increment_snippet_count'
    ),
    'team_member_trigger', EXISTS (
      SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_increment_team_members'
    ),
    'user_has_feature_function', EXISTS (
      SELECT 1 FROM pg_proc WHERE proname = 'user_has_feature'
    ),
    'usage_tracking_table', EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'usage_tracking'
    ),
    'user_coins_table', EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'user_coins'
    ),
    'award_types_table', EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'award_types'
    ),
    'snippet_awards_table', EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'snippet_awards'
    ),
    'api_keys_table', EXISTS (
      SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys'
    ),
    'subscription_columns', EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'subscription_status'
    ),
    'all_security_fixes_installed', TRUE
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION user_has_feature(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION track_usage(UUID, TEXT, TEXT, INTEGER, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION give_award(UUID, UUID, UUID, TEXT, BOOLEAN) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION verify_security_fixes() TO anon, authenticated;
