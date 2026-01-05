-- ============================================================================
-- Reputation and Karma System for Snippet Factory
-- ============================================================================
-- Implements a Reddit-style reputation system to gamify user engagement

-- Add reputation fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS reputation INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reputation_level TEXT DEFAULT 'Beginner',
ADD COLUMN IF NOT EXISTS total_upvotes_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_downvotes_received INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS badges JSONB DEFAULT '[]';

-- Create reputation_events table to track all reputation changes
CREATE TABLE IF NOT EXISTS reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'snippet_upvote',
    'snippet_downvote',
    'comment_upvote',
    'comment_downvote',
    'snippet_created',
    'comment_created',
    'snippet_shared',
    'community_joined',
    'achievement_earned',
    'other'
  )),
  points INTEGER NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('snippet', 'comment', 'community', 'achievement')),
  resource_id UUID,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reputation_events_user ON reputation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reputation_events_created_at ON reputation_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_users_reputation ON users(reputation DESC);

-- Enable RLS
ALTER TABLE reputation_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reputation events"
  ON reputation_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public reputation events"
  ON reputation_events FOR SELECT
  USING (true);

-- Function to calculate reputation level based on points
CREATE OR REPLACE FUNCTION calculate_reputation_level(points INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF points >= 10000 THEN
    RETURN 'Legend';
  ELSIF points >= 5000 THEN
    RETURN 'Expert';
  ELSIF points >= 1000 THEN
    RETURN 'Advanced';
  ELSIF points >= 100 THEN
    RETURN 'Intermediate';
  ELSE
    RETURN 'Beginner';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to add reputation points
CREATE OR REPLACE FUNCTION add_reputation(
  p_user_id UUID,
  p_event_type TEXT,
  p_points INTEGER,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert reputation event
  INSERT INTO reputation_events (
    user_id,
    event_type,
    points,
    resource_type,
    resource_id,
    description
  ) VALUES (
    p_user_id,
    p_event_type,
    p_points,
    p_resource_type,
    p_resource_id,
    p_description
  );

  -- Update user reputation
  UPDATE users
  SET
    reputation = reputation + p_points,
    reputation_level = calculate_reputation_level(reputation + p_points),
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Function to handle snippet upvotes (reputation gain)
CREATE OR REPLACE FUNCTION handle_snippet_upvote_reputation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  snippet_owner_id UUID;
BEGIN
  -- Get snippet owner
  SELECT created_by INTO snippet_owner_id
  FROM snippets
  WHERE id = NEW.snippet_id;

  -- Don't give reputation for self-votes
  IF snippet_owner_id != NEW.user_id THEN
    -- Add reputation to snippet owner
    PERFORM add_reputation(
      snippet_owner_id,
      'snippet_upvote',
      10, -- 10 points per upvote
      'snippet',
      NEW.snippet_id,
      'Snippet upvoted'
    );

    -- Update total upvotes count
    UPDATE users
    SET total_upvotes_received = total_upvotes_received + 1
    WHERE id = snippet_owner_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to handle snippet downvotes (reputation loss)
CREATE OR REPLACE FUNCTION handle_snippet_downvote_reputation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  snippet_owner_id UUID;
BEGIN
  -- Get snippet owner
  SELECT created_by INTO snippet_owner_id
  FROM snippets
  WHERE id = NEW.snippet_id;

  -- Don't affect reputation for self-votes
  IF snippet_owner_id != NEW.user_id THEN
    -- Subtract reputation from snippet owner
    PERFORM add_reputation(
      snippet_owner_id,
      'snippet_downvote',
      -2, -- -2 points per downvote
      'snippet',
      NEW.snippet_id,
      'Snippet downvoted'
    );

    -- Update total downvotes count
    UPDATE users
    SET total_downvotes_received = total_downvotes_received + 1
    WHERE id = snippet_owner_id;
  END IF;

  RETURN NEW;
END;
$$;

-- Function to give reputation for creating snippets
CREATE OR REPLACE FUNCTION handle_snippet_creation_reputation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add reputation for creating a snippet
  PERFORM add_reputation(
    NEW.created_by,
    'snippet_created',
    5, -- 5 points for creating a snippet
    'snippet',
    NEW.id,
    'Created a new snippet'
  );

  RETURN NEW;
END;
$$;

-- Function to give reputation for sharing to community
CREATE OR REPLACE FUNCTION handle_snippet_share_reputation()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Add reputation for sharing snippet to community
  PERFORM add_reputation(
    NEW.posted_by,
    'snippet_shared',
    3, -- 3 points for sharing
    'snippet',
    NEW.snippet_id,
    'Shared snippet to community'
  );

  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER trigger_snippet_upvote_reputation
  AFTER INSERT ON snippet_votes
  FOR EACH ROW
  WHEN (NEW.vote_type = 'upvote')
  EXECUTE FUNCTION handle_snippet_upvote_reputation();

CREATE TRIGGER trigger_snippet_downvote_reputation
  AFTER INSERT ON snippet_votes
  FOR EACH ROW
  WHEN (NEW.vote_type = 'downvote')
  EXECUTE FUNCTION handle_snippet_downvote_reputation();

CREATE TRIGGER trigger_snippet_creation_reputation
  AFTER INSERT ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION handle_snippet_creation_reputation();

CREATE TRIGGER trigger_snippet_share_reputation
  AFTER INSERT ON community_snippets
  FOR EACH ROW
  EXECUTE FUNCTION handle_snippet_share_reputation();

-- ============================================================================
-- Achievement Badges System
-- ============================================================================

-- Predefined badges
COMMENT ON COLUMN users.badges IS 'Array of earned badges: first_snippet, 100_upvotes, popular_creator, community_leader, prolific_writer, etc.';

-- Function to award a badge
CREATE OR REPLACE FUNCTION award_badge(
  p_user_id UUID,
  p_badge_id TEXT,
  p_badge_name TEXT,
  p_badge_description TEXT,
  p_reputation_bonus INTEGER DEFAULT 0
)
RETURNS void
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  current_badges JSONB;
  badge_exists BOOLEAN;
BEGIN
  -- Get current badges
  SELECT badges INTO current_badges
  FROM users
  WHERE id = p_user_id;

  -- Check if badge already exists
  SELECT EXISTS(
    SELECT 1
    FROM jsonb_array_elements(current_badges) badge
    WHERE badge->>'id' = p_badge_id
  ) INTO badge_exists;

  -- If badge doesn't exist, award it
  IF NOT badge_exists THEN
    -- Add badge
    UPDATE users
    SET badges = badges || jsonb_build_array(
      jsonb_build_object(
        'id', p_badge_id,
        'name', p_badge_name,
        'description', p_badge_description,
        'earned_at', NOW()
      )
    )
    WHERE id = p_user_id;

    -- Add reputation bonus
    IF p_reputation_bonus > 0 THEN
      PERFORM add_reputation(
        p_user_id,
        'achievement_earned',
        p_reputation_bonus,
        'achievement',
        NULL,
        'Earned badge: ' || p_badge_name
      );
    END IF;
  END IF;
END;
$$;

-- Function to check and award badges automatically
CREATE OR REPLACE FUNCTION check_and_award_badges()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  snippet_count INTEGER;
  total_upvotes INTEGER;
  community_count INTEGER;
BEGIN
  -- First Snippet Badge
  SELECT COUNT(*) INTO snippet_count
  FROM snippets
  WHERE created_by = NEW.created_by;

  IF snippet_count = 1 THEN
    PERFORM award_badge(
      NEW.created_by,
      'first_snippet',
      'First Snippet',
      'Created your first snippet',
      10
    );
  END IF;

  -- Prolific Writer (10 snippets)
  IF snippet_count = 10 THEN
    PERFORM award_badge(
      NEW.created_by,
      'prolific_writer',
      'Prolific Writer',
      'Created 10 snippets',
      50
    );
  END IF;

  -- Code Master (50 snippets)
  IF snippet_count = 50 THEN
    PERFORM award_badge(
      NEW.created_by,
      'code_master',
      'Code Master',
      'Created 50 snippets',
      200
    );
  END IF;

  -- Check upvotes
  SELECT total_upvotes_received INTO total_upvotes
  FROM users
  WHERE id = NEW.created_by;

  -- Popular Creator (100 upvotes)
  IF total_upvotes >= 100 THEN
    PERFORM award_badge(
      NEW.created_by,
      'popular_creator',
      'Popular Creator',
      'Received 100 upvotes',
      100
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to check badges after snippet creation
CREATE TRIGGER trigger_check_badges
  AFTER INSERT ON snippets
  FOR EACH ROW
  EXECUTE FUNCTION check_and_award_badges();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get user's reputation rank
CREATE OR REPLACE FUNCTION get_user_rank(p_user_id UUID)
RETURNS INTEGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_rank INTEGER;
BEGIN
  SELECT rank INTO user_rank
  FROM (
    SELECT
      id,
      RANK() OVER (ORDER BY reputation DESC) as rank
    FROM users
  ) ranked
  WHERE id = p_user_id;

  RETURN COALESCE(user_rank, 0);
END;
$$;

-- Get reputation leaderboard
CREATE OR REPLACE FUNCTION get_reputation_leaderboard(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  reputation INTEGER,
  reputation_level TEXT,
  rank BIGINT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.full_name,
    u.avatar_url,
    u.reputation,
    u.reputation_level,
    RANK() OVER (ORDER BY u.reputation DESC)
  FROM users u
  WHERE u.reputation > 0
  ORDER BY u.reputation DESC
  LIMIT p_limit;
END;
$$;

-- ============================================================================
-- Initial Data
-- ============================================================================

-- Update existing users' reputation based on current data
-- This is a one-time migration to calculate existing reputation

DO $$
DECLARE
  user_record RECORD;
  total_upvotes_count INTEGER;
  total_snippets_count INTEGER;
BEGIN
  FOR user_record IN SELECT id FROM users LOOP
    -- Count upvotes
    SELECT COALESCE(SUM(upvote_count), 0) INTO total_upvotes_count
    FROM snippets
    WHERE created_by = user_record.id;

    -- Count snippets
    SELECT COUNT(*) INTO total_snippets_count
    FROM snippets
    WHERE created_by = user_record.id;

    -- Calculate initial reputation
    UPDATE users
    SET
      reputation = (total_upvotes_count * 10) + (total_snippets_count * 5),
      reputation_level = calculate_reputation_level((total_upvotes_count * 10) + (total_snippets_count * 5)),
      total_upvotes_received = total_upvotes_count
    WHERE id = user_record.id;
  END LOOP;
END $$;
