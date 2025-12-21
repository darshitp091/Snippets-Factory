-- =============================================
-- SNIPPET FACTORY - COMPLETE DATABASE SCHEMA
-- =============================================
-- This creates ALL tables, triggers, and policies
-- Run this ONCE in your fresh Supabase project
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =============================================
-- DROP EXISTING OBJECTS (Clean slate)
-- =============================================

-- Drop triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_snippets_updated_at ON public.snippets;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- =============================================
-- CREATE TABLES
-- =============================================

-- 1. Users Table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  snippet_count INTEGER DEFAULT 0,
  max_snippets INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  max_members INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- 4. Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#588157',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, name)
);

-- 5. Snippets Table (Main feature!)
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  usage_count INTEGER DEFAULT 0,
  placeholders JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. Snippet Usage Tracking
CREATE TABLE IF NOT EXISTS public.snippet_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'copy', 'edit', 'share', 'create')),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('snippet', 'team', 'user', 'category')),
  resource_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- CREATE INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);

CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

CREATE INDEX IF NOT EXISTS idx_categories_team ON public.categories(team_id);

CREATE INDEX IF NOT EXISTS idx_snippets_team ON public.snippets(team_id);
CREATE INDEX IF NOT EXISTS idx_snippets_creator ON public.snippets(created_by);
CREATE INDEX IF NOT EXISTS idx_snippets_category ON public.snippets(category_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON public.snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_public ON public.snippets(is_public);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON public.snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_snippets_title_search ON public.snippets USING GIN(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_snippets_code_search ON public.snippets USING GIN(to_tsvector('english', code));

CREATE INDEX IF NOT EXISTS idx_snippet_usage_snippet ON public.snippet_usage(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_user ON public.snippet_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_timestamp ON public.snippet_usage(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON public.audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DROP EXISTING POLICIES (Clean slate)
-- =============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop all policies on all tables
  FOR r IN (
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
  ) LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
  END LOOP;
END $$;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Users Policies
CREATE POLICY "Users can view own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.users FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Teams Policies
CREATE POLICY "Team members can view teams"
  ON public.teams FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams"
  ON public.teams FOR INSERT
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Team owners can update teams"
  ON public.teams FOR UPDATE
  USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete teams"
  ON public.teams FOR DELETE
  USING (owner_id = auth.uid());

-- Team Members Policies
CREATE POLICY "Team members can view membership"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can manage members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id
        AND tm.user_id = auth.uid()
        AND tm.role IN ('owner', 'admin')
    )
  );

-- Categories Policies
CREATE POLICY "Team members can view categories"
  ON public.categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = categories.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can manage categories"
  ON public.categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = categories.team_id AND user_id = auth.uid()
    )
  );

-- Snippets Policies
CREATE POLICY "Users can view public snippets"
  ON public.snippets FOR SELECT
  USING (is_public = TRUE);

CREATE POLICY "Team members can view team snippets"
  ON public.snippets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = snippets.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create snippets"
  ON public.snippets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = snippets.team_id AND user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Snippet creators can update snippets"
  ON public.snippets FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Snippet creators can delete snippets"
  ON public.snippets FOR DELETE
  USING (created_by = auth.uid());

-- Snippet Usage Policies
CREATE POLICY "Users can view own usage"
  ON public.snippet_usage FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can log snippet usage"
  ON public.snippet_usage FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Audit Logs Policies
CREATE POLICY "Team members can view team audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = audit_logs.team_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- CREATE FUNCTIONS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Function: Handle new user signup (THE CRITICAL ONE!)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_team_id UUID;
  v_user_name TEXT;
  v_team_slug TEXT;
BEGIN
  -- Extract user name from metadata
  v_user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    split_part(NEW.email, '@', 1),
    'User'
  );

  -- Generate unique team slug
  v_team_slug := 'team-' || NEW.id::text;

  -- Step 1: Create user record
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    v_user_name,
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = NOW();

  -- Step 2: Create personal team
  INSERT INTO public.teams (name, slug, owner_id, plan)
  VALUES (
    v_user_name || '''s Team',
    v_team_slug,
    NEW.id,
    'free'
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO v_team_id;

  -- Step 3: Add user as team owner
  IF v_team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (v_team_id, NEW.id, 'owner')
    ON CONFLICT (team_id, user_id) DO NOTHING;

    -- Step 4: Create default categories
    INSERT INTO public.categories (team_id, name, color, icon)
    VALUES
      (v_team_id, 'Frontend', '#3178c6', '🎨'),
      (v_team_id, 'Backend', '#3776ab', '⚙️'),
      (v_team_id, 'Database', '#e38c00', '💾'),
      (v_team_id, 'DevOps', '#00ADD8', '🚀'),
      (v_team_id, 'Utils', '#A3B18A', '🔧'),
      (v_team_id, 'Algorithms', '#CE412B', '🧮')
    ON CONFLICT (team_id, name) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- =============================================
-- CREATE TRIGGERS
-- =============================================

-- Trigger: Auto-create user record on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger: Update updated_at on users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on teams
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger: Update updated_at on snippets
CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON public.snippets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Allow anon users to read public snippets
GRANT SELECT ON public.snippets TO anon;
GRANT SELECT ON public.users TO anon;

-- =============================================
-- VERIFICATION
-- =============================================

DO $$
DECLARE
  v_table_count INTEGER;
  v_trigger_count INTEGER;
  v_policy_count INTEGER;
BEGIN
  -- Count tables
  SELECT COUNT(*) INTO v_table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name IN ('users', 'teams', 'team_members', 'categories', 'snippets', 'snippet_usage', 'audit_logs');

  -- Count triggers
  SELECT COUNT(*) INTO v_trigger_count
  FROM pg_trigger
  WHERE tgname IN ('on_auth_user_created', 'update_users_updated_at', 'update_teams_updated_at', 'update_snippets_updated_at');

  -- Count policies
  SELECT COUNT(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public';

  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Tables created: % of 7', v_table_count;
  RAISE NOTICE 'Triggers created: % of 4', v_trigger_count;
  RAISE NOTICE 'Policies created: %', v_policy_count;
  RAISE NOTICE '================================================';
  RAISE NOTICE 'You can now test signup in your application!';
  RAISE NOTICE '================================================';
END $$;
