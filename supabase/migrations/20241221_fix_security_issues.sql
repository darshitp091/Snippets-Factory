-- ============================================================================
-- Fix Supabase Security Issues
-- ============================================================================
-- This migration fixes all security errors and warnings from Supabase linter
--
-- Issues Fixed:
-- 1. ERROR: RLS not enabled on verification_tiers table
-- 2. WARN: Functions without immutable search_path (11 functions)
-- 3. WARN: pg_trgm extension in public schema
-- 4. INFO: Auth leaked password protection (dashboard setting)
-- ============================================================================

-- ============================================================================
-- 1. FIX: Enable RLS on verification_tiers table
-- ============================================================================

-- Enable Row Level Security
ALTER TABLE IF EXISTS verification_tiers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for verification_tiers
-- Policy: Anyone can view verification tiers
CREATE POLICY "Verification tiers are viewable by everyone"
  ON verification_tiers
  FOR SELECT
  USING (true);

-- Policy: Only admins can insert verification tiers (service role)
CREATE POLICY "Only service role can insert verification tiers"
  ON verification_tiers
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only admins can update verification tiers (service role)
CREATE POLICY "Only service role can update verification tiers"
  ON verification_tiers
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy: Only admins can delete verification tiers (service role)
CREATE POLICY "Only service role can delete verification tiers"
  ON verification_tiers
  FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. FIX: Add search_path to all functions to make them secure
-- ============================================================================

-- Function 1: update_community_member_count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET member_count = GREATEST(0, member_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function 2: update_community_follower_count
CREATE OR REPLACE FUNCTION update_community_follower_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET follower_count = follower_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function 3: update_snippet_vote_count
CREATE OR REPLACE FUNCTION update_snippet_vote_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE snippets
  SET
    upvotes = (SELECT COUNT(*) FROM snippet_votes WHERE snippet_id = NEW.snippet_id AND vote_type = 'upvote'),
    downvotes = (SELECT COUNT(*) FROM snippet_votes WHERE snippet_id = NEW.snippet_id AND vote_type = 'downvote')
  WHERE id = NEW.snippet_id;
  RETURN NULL;
END;
$$;

-- Function 4: update_snippet_comment_count
CREATE OR REPLACE FUNCTION update_snippet_comment_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE snippets
    SET comment_count = comment_count + 1
    WHERE id = NEW.snippet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE snippets
    SET comment_count = GREATEST(0, comment_count - 1)
    WHERE id = OLD.snippet_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function 5: update_user_follow_counts
CREATE OR REPLACE FUNCTION update_user_follow_counts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment follower count for the user being followed
    UPDATE users
    SET follower_count = follower_count + 1
    WHERE id = NEW.following_id;

    -- Increment following count for the user who followed
    UPDATE users
    SET following_count = following_count + 1
    WHERE id = NEW.follower_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement follower count
    UPDATE users
    SET follower_count = GREATEST(0, follower_count - 1)
    WHERE id = OLD.following_id;

    -- Decrement following count
    UPDATE users
    SET following_count = GREATEST(0, following_count - 1)
    WHERE id = OLD.follower_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function 6: add_owner_as_member
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add owner as member with 'owner' role
  INSERT INTO community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$;

-- Function 7: update_community_snippet_count
CREATE OR REPLACE FUNCTION update_community_snippet_count()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE communities
    SET snippet_count = snippet_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE communities
    SET snippet_count = GREATEST(0, snippet_count - 1)
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Function 8: update_payment_history_updated_at
CREATE OR REPLACE FUNCTION update_payment_history_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function 9: check_and_downgrade_expired_plans
CREATE OR REPLACE FUNCTION check_and_downgrade_expired_plans()
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
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
$$;

-- Function 10: update_plan_updated_at
CREATE OR REPLACE FUNCTION update_plan_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.plan IS DISTINCT FROM OLD.plan THEN
    NEW.plan_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

-- Function 11: update_updated_at_column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ============================================================================
-- 3. FIX: Move pg_trgm extension to extensions schema
-- ============================================================================

-- Create extensions schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS extensions;

-- Drop extension from public schema if it exists
DROP EXTENSION IF EXISTS pg_trgm CASCADE;

-- Create extension in extensions schema
CREATE EXTENSION IF NOT EXISTS pg_trgm SCHEMA extensions;

-- Grant usage on extensions schema to authenticated users
GRANT USAGE ON SCHEMA extensions TO authenticated;
GRANT USAGE ON SCHEMA extensions TO anon;

-- Update search path for database to include extensions schema
-- This allows queries to use pg_trgm functions without schema qualification
ALTER DATABASE postgres SET search_path TO public, extensions;

-- ============================================================================
-- 4. INFO: Auth Leaked Password Protection
-- ============================================================================

-- NOTE: This cannot be enabled via SQL migration.
-- To enable leaked password protection:
--
-- 1. Go to Supabase Dashboard
-- 2. Navigate to: Authentication → Policies
-- 3. Under "Password Policy", enable:
--    - "Enable password strength checks"
--    - "Check for compromised passwords (HaveIBeenPwned)"
--
-- This will prevent users from using passwords that have been leaked in data breaches.

-- ============================================================================
-- 5. VERIFICATION: Add comments explaining security fixes
-- ============================================================================

COMMENT ON TABLE verification_tiers IS 'Verification tier information. RLS enabled for security.';

COMMENT ON FUNCTION update_community_member_count IS 'Updates community member count. Secure with immutable search_path.';
COMMENT ON FUNCTION update_community_follower_count IS 'Updates community follower count. Secure with immutable search_path.';
COMMENT ON FUNCTION update_snippet_vote_count IS 'Updates snippet vote counts. Secure with immutable search_path.';
COMMENT ON FUNCTION update_snippet_comment_count IS 'Updates snippet comment count. Secure with immutable search_path.';
COMMENT ON FUNCTION update_user_follow_counts IS 'Updates user follow/follower counts. Secure with immutable search_path.';
COMMENT ON FUNCTION add_owner_as_member IS 'Automatically adds community owner as member. Secure with immutable search_path.';
COMMENT ON FUNCTION update_community_snippet_count IS 'Updates community snippet count. Secure with immutable search_path.';
COMMENT ON FUNCTION update_payment_history_updated_at IS 'Auto-updates payment_history.updated_at. Secure with immutable search_path.';
COMMENT ON FUNCTION check_and_downgrade_expired_plans IS 'Downgrades expired user plans to free. Secure with immutable search_path.';
COMMENT ON FUNCTION update_plan_updated_at IS 'Auto-updates plan_updated_at when plan changes. Secure with immutable search_path.';
COMMENT ON FUNCTION update_updated_at_column IS 'Generic trigger function to update updated_at column. Secure with immutable search_path.';

-- ============================================================================
-- 6. SUMMARY OF FIXES
-- ============================================================================

-- This migration has fixed:
-- ✅ 1 ERROR:  RLS enabled on verification_tiers table
-- ✅ 11 WARNS: All functions now have immutable search_path
-- ✅ 1 WARN:  pg_trgm extension moved to extensions schema
-- ⚠️  1 INFO:  Auth leaked password protection (manual dashboard setting required)

-- After running this migration:
-- 1. All security ERRORS will be resolved ✅
-- 2. All function security WARNINGS will be resolved ✅
-- 3. Extension warning will be resolved ✅
-- 4. You need to manually enable leaked password protection in Supabase Dashboard

-- Run database linter again to verify all issues are resolved!
