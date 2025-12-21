-- =====================================================
-- SNIPPET FACTORY - COMMUNITIES & SOCIAL FEATURES
-- Migration: Communities, Verification, Engagement
-- Date: December 20, 2025
-- =====================================================

-- =====================================================
-- 1. COMMUNITIES TABLE
-- Core table for community management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Verification System
  is_verified BOOLEAN DEFAULT FALSE,
  verification_tier VARCHAR(20) CHECK (verification_tier IN ('none', 'blue', 'green', 'gold')),
  verification_paid_at TIMESTAMP WITH TIME ZONE,
  verification_expires_at TIMESTAMP WITH TIME ZONE,

  -- Visibility Settings
  visibility VARCHAR(20) DEFAULT 'public' CHECK (visibility IN ('public', 'followers_only', 'private')),

  -- Stats
  member_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  snippet_count INTEGER DEFAULT 0,

  -- Metadata
  rules TEXT[],
  tags TEXT[],
  category VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_slug CHECK (slug ~* '^[a-z0-9_-]+$'),
  CONSTRAINT name_length CHECK (length(name) >= 3 AND length(name) <= 100)
);

-- Indexes for communities
CREATE INDEX idx_communities_owner ON public.communities(owner_id);
CREATE INDEX idx_communities_slug ON public.communities(slug);
CREATE INDEX idx_communities_verification ON public.communities(is_verified, verification_tier);
CREATE INDEX idx_communities_visibility ON public.communities(visibility);
CREATE INDEX idx_communities_created ON public.communities(created_at DESC);

-- Full-text search on communities
CREATE INDEX idx_communities_search ON public.communities USING GIN (
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))
);

-- =====================================================
-- 2. COMMUNITY MEMBERS TABLE
-- Track community membership with roles
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(community_id, user_id)
);

-- Indexes for community members
CREATE INDEX idx_community_members_community ON public.community_members(community_id);
CREATE INDEX idx_community_members_user ON public.community_members(user_id);
CREATE INDEX idx_community_members_role ON public.community_members(role);

-- =====================================================
-- 3. COMMUNITY FOLLOWERS TABLE
-- Track users following communities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(community_id, user_id)
);

-- Indexes for followers
CREATE INDEX idx_community_followers_community ON public.community_followers(community_id);
CREATE INDEX idx_community_followers_user ON public.community_followers(user_id);
CREATE INDEX idx_community_followers_date ON public.community_followers(followed_at DESC);

-- =====================================================
-- 4. USER FOLLOWS TABLE
-- Track user-to-user follows
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Indexes for user follows
CREATE INDEX idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX idx_user_follows_following ON public.user_follows(following_id);

-- =====================================================
-- 5. COMMUNITY SNIPPETS TABLE
-- Link snippets to communities
-- =====================================================
CREATE TABLE IF NOT EXISTS public.community_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  posted_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned BOOLEAN DEFAULT FALSE,
  posted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(community_id, snippet_id)
);

-- Indexes for community snippets
CREATE INDEX idx_community_snippets_community ON public.community_snippets(community_id, posted_at DESC);
CREATE INDEX idx_community_snippets_snippet ON public.community_snippets(snippet_id);
CREATE INDEX idx_community_snippets_user ON public.community_snippets(posted_by);
CREATE INDEX idx_community_snippets_pinned ON public.community_snippets(is_pinned, posted_at DESC);

-- =====================================================
-- 6. SNIPPET VOTES TABLE
-- Upvote/downvote system for snippets
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(snippet_id, user_id)
);

-- Indexes for votes
CREATE INDEX idx_snippet_votes_snippet ON public.snippet_votes(snippet_id);
CREATE INDEX idx_snippet_votes_user ON public.snippet_votes(user_id);
CREATE INDEX idx_snippet_votes_type ON public.snippet_votes(vote_type);

-- =====================================================
-- 7. SNIPPET COMMENTS TABLE
-- Comments and discussions on snippets
-- =====================================================
CREATE TABLE IF NOT EXISTS public.snippet_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_comment_id UUID REFERENCES public.snippet_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvote_count INTEGER DEFAULT 0,
  downvote_count INTEGER DEFAULT 0,
  is_edited BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT content_length CHECK (length(content) >= 1 AND length(content) <= 5000)
);

-- Indexes for comments
CREATE INDEX idx_snippet_comments_snippet ON public.snippet_comments(snippet_id, created_at DESC);
CREATE INDEX idx_snippet_comments_user ON public.snippet_comments(user_id);
CREATE INDEX idx_snippet_comments_parent ON public.snippet_comments(parent_comment_id);

-- =====================================================
-- 8. COMMENT VOTES TABLE
-- Upvote/downvote for comments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.comment_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES public.snippet_comments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('upvote', 'downvote')),
  voted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  UNIQUE(comment_id, user_id)
);

-- Indexes for comment votes
CREATE INDEX idx_comment_votes_comment ON public.comment_votes(comment_id);
CREATE INDEX idx_comment_votes_user ON public.comment_votes(user_id);

-- =====================================================
-- 9. VERIFICATION PAYMENTS TABLE
-- Track community verification payments
-- =====================================================
CREATE TABLE IF NOT EXISTS public.verification_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id UUID NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verification_tier VARCHAR(20) NOT NULL CHECK (verification_tier IN ('blue', 'green', 'gold')),
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'INR',
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  payment_method VARCHAR(50),
  paid_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

-- Indexes for verification payments
CREATE INDEX idx_verification_payments_community ON public.verification_payments(community_id);
CREATE INDEX idx_verification_payments_user ON public.verification_payments(user_id);
CREATE INDEX idx_verification_payments_status ON public.verification_payments(payment_status);

-- =====================================================
-- 10. UPDATE SNIPPETS TABLE
-- Add social features to existing snippets
-- =====================================================
ALTER TABLE public.snippets
ADD COLUMN IF NOT EXISTS upvote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS downvote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS share_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- =====================================================
-- 11. UPDATE USERS TABLE
-- Add social profile fields
-- =====================================================
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS website_url TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(100),
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(50),
ADD COLUMN IF NOT EXISTS github_username VARCHAR(50),
ADD COLUMN IF NOT EXISTS follower_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS community_count INTEGER DEFAULT 0;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function: Update community member count
CREATE OR REPLACE FUNCTION update_community_member_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET member_count = member_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET member_count = member_count - 1
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_member_count
AFTER INSERT OR DELETE ON public.community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- Function: Update community follower count
CREATE OR REPLACE FUNCTION update_community_follower_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities
    SET follower_count = follower_count + 1
    WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities
    SET follower_count = follower_count - 1
    WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_follower_count
AFTER INSERT OR DELETE ON public.community_followers
FOR EACH ROW EXECUTE FUNCTION update_community_follower_count();

-- Function: Update snippet vote count
CREATE OR REPLACE FUNCTION update_snippet_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'upvote' THEN
      UPDATE public.snippets SET upvote_count = upvote_count + 1 WHERE id = NEW.snippet_id;
    ELSE
      UPDATE public.snippets SET downvote_count = downvote_count + 1 WHERE id = NEW.snippet_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'upvote' THEN
      UPDATE public.snippets SET upvote_count = upvote_count - 1 WHERE id = OLD.snippet_id;
    ELSE
      UPDATE public.snippets SET downvote_count = downvote_count - 1 WHERE id = OLD.snippet_id;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vote_type = 'upvote' AND NEW.vote_type = 'downvote' THEN
      UPDATE public.snippets SET upvote_count = upvote_count - 1, downvote_count = downvote_count + 1 WHERE id = NEW.snippet_id;
    ELSIF OLD.vote_type = 'downvote' AND NEW.vote_type = 'upvote' THEN
      UPDATE public.snippets SET upvote_count = upvote_count + 1, downvote_count = downvote_count - 1 WHERE id = NEW.snippet_id;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_snippet_vote_count
AFTER INSERT OR UPDATE OR DELETE ON public.snippet_votes
FOR EACH ROW EXECUTE FUNCTION update_snippet_vote_count();

-- Function: Update comment count
CREATE OR REPLACE FUNCTION update_snippet_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.snippets SET comment_count = comment_count + 1 WHERE id = NEW.snippet_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.snippets SET comment_count = comment_count - 1 WHERE id = OLD.snippet_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_snippet_comment_count
AFTER INSERT OR DELETE ON public.snippet_comments
FOR EACH ROW EXECUTE FUNCTION update_snippet_comment_count();

-- Function: Update user follow counts
CREATE OR REPLACE FUNCTION update_user_follow_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users SET following_count = following_count + 1 WHERE id = NEW.follower_id;
    UPDATE public.users SET follower_count = follower_count + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users SET following_count = following_count - 1 WHERE id = OLD.follower_id;
    UPDATE public.users SET follower_count = follower_count - 1 WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_follow_counts
AFTER INSERT OR DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION update_user_follow_counts();

-- Function: Auto-add owner as member when creating community
CREATE OR REPLACE FUNCTION add_owner_as_member()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.community_members (community_id, user_id, role)
  VALUES (NEW.id, NEW.owner_id, 'owner');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_add_owner_as_member
AFTER INSERT ON public.communities
FOR EACH ROW EXECUTE FUNCTION add_owner_as_member();

-- Function: Update community snippet count
CREATE OR REPLACE FUNCTION update_community_snippet_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.communities SET snippet_count = snippet_count + 1 WHERE id = NEW.community_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.communities SET snippet_count = snippet_count - 1 WHERE id = OLD.community_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_community_snippet_count
AFTER INSERT OR DELETE ON public.community_snippets
FOR EACH ROW EXECUTE FUNCTION update_community_snippet_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_payments ENABLE ROW LEVEL SECURITY;

-- Communities Policies
CREATE POLICY "Public communities are viewable by everyone"
  ON public.communities FOR SELECT
  USING (visibility = 'public' OR owner_id = auth.uid());

CREATE POLICY "Followers can view follower-only communities"
  ON public.communities FOR SELECT
  USING (
    visibility = 'public'
    OR owner_id = auth.uid()
    OR (visibility = 'followers_only' AND EXISTS (
      SELECT 1 FROM public.community_followers
      WHERE community_id = communities.id AND user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create communities"
  ON public.communities FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their communities"
  ON public.communities FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their communities"
  ON public.communities FOR DELETE
  USING (auth.uid() = owner_id);

-- Community Members Policies
CREATE POLICY "Community members are viewable by community members"
  ON public.community_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_members.community_id
      AND (visibility = 'public' OR owner_id = auth.uid())
    )
  );

CREATE POLICY "Users can join public communities"
  ON public.community_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave communities"
  ON public.community_members FOR DELETE
  USING (auth.uid() = user_id);

-- Community Followers Policies
CREATE POLICY "Followers are viewable by everyone"
  ON public.community_followers FOR SELECT
  USING (true);

CREATE POLICY "Users can follow communities"
  ON public.community_followers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unfollow communities"
  ON public.community_followers FOR DELETE
  USING (auth.uid() = user_id);

-- User Follows Policies
CREATE POLICY "User follows are viewable by everyone"
  ON public.user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON public.user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON public.user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Community Snippets Policies
CREATE POLICY "Community snippets are viewable by community members"
  ON public.community_snippets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.communities
      WHERE id = community_snippets.community_id
      AND (visibility = 'public' OR owner_id = auth.uid())
    )
  );

CREATE POLICY "Members can post snippets to communities"
  ON public.community_snippets FOR INSERT
  WITH CHECK (
    auth.uid() = posted_by AND
    EXISTS (
      SELECT 1 FROM public.community_members
      WHERE community_id = community_snippets.community_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can remove their own posts"
  ON public.community_snippets FOR DELETE
  USING (auth.uid() = posted_by);

-- Snippet Votes Policies
CREATE POLICY "Anyone can view votes"
  ON public.snippet_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on snippets"
  ON public.snippet_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their votes"
  ON public.snippet_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their votes"
  ON public.snippet_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Snippet Comments Policies
CREATE POLICY "Anyone can view comments"
  ON public.snippet_comments FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can comment"
  ON public.snippet_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON public.snippet_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON public.snippet_comments FOR DELETE
  USING (auth.uid() = user_id);

-- Comment Votes Policies
CREATE POLICY "Anyone can view comment votes"
  ON public.comment_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can vote on comments"
  ON public.comment_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can change their comment votes"
  ON public.comment_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove their comment votes"
  ON public.comment_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Verification Payments Policies
CREATE POLICY "Users can view their own payments"
  ON public.verification_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create payment records"
  ON public.verification_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SEED DATA FOR VERIFICATION TIERS
-- =====================================================

-- Create a verification_tiers reference table
CREATE TABLE IF NOT EXISTS public.verification_tiers (
  tier VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description TEXT,
  price_inr DECIMAL(10, 2) NOT NULL,
  price_usd DECIMAL(10, 2) NOT NULL,
  duration_days INTEGER NOT NULL,
  features JSONB,
  badge_color VARCHAR(20),
  display_order INTEGER
);

INSERT INTO public.verification_tiers (tier, name, description, price_inr, price_usd, duration_days, features, badge_color, display_order) VALUES
('blue', 'Blue Verification', 'Basic verification for communities', 499.00, 6.00, 365, '["Verified badge", "Priority support", "Custom badge color"]', '#3B82F6', 1),
('green', 'Green Verification', 'Premium verification with enhanced features', 999.00, 12.00, 365, '["Verified badge", "Priority support", "Custom badge color", "Analytics dashboard", "Featured placement"]', '#10B981', 2),
('gold', 'Gold Verification', 'Ultimate verification with all features', 1999.00, 24.00, 365, '["Verified badge", "Priority support", "Custom badge color", "Analytics dashboard", "Featured placement", "API access", "Custom integrations"]', '#F59E0B', 3);

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Communities & Social Features Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - communities (with verification system)';
  RAISE NOTICE '  - community_members (roles & permissions)';
  RAISE NOTICE '  - community_followers (follow system)';
  RAISE NOTICE '  - user_follows (user-to-user follows)';
  RAISE NOTICE '  - community_snippets (snippet sharing)';
  RAISE NOTICE '  - snippet_votes (upvote/downvote)';
  RAISE NOTICE '  - snippet_comments (discussions)';
  RAISE NOTICE '  - comment_votes (comment engagement)';
  RAISE NOTICE '  - verification_payments (paid badges)';
  RAISE NOTICE '  - verification_tiers (pricing tiers)';
  RAISE NOTICE '';
  RAISE NOTICE 'Features Added:';
  RAISE NOTICE '  ✓ Reddit-style communities';
  RAISE NOTICE '  ✓ Instagram-style verification badges';
  RAISE NOTICE '  ✓ Upvote/downvote system';
  RAISE NOTICE '  ✓ Comments & discussions';
  RAISE NOTICE '  ✓ Follow system (users & communities)';
  RAISE NOTICE '  ✓ Visibility controls (public/followers-only/private)';
  RAISE NOTICE '  ✓ Payment integration for verification';
  RAISE NOTICE '  ✓ Auto-counting triggers';
  RAISE NOTICE '  ✓ Row-level security policies';
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Run this migration in Supabase';
  RAISE NOTICE '  2. Build public snippets discovery page';
  RAISE NOTICE '  3. Create community management UI';
  RAISE NOTICE '  4. Implement verification payment flow';
  RAISE NOTICE '  5. Update pricing page with new features';
END $$;
