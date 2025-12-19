-- Snippet Factory Database Schema - Complete & Idempotent Migration
-- This migration detects existing structure and only adds what's missing

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CREATE CUSTOM TYPES
-- =============================================

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'member', 'viewer');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- CREATE TABLES (IF NOT EXISTS)
-- =============================================

-- Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan plan_type DEFAULT 'free' NOT NULL,
  snippet_count INTEGER DEFAULT 0 NOT NULL,
  max_snippets INTEGER DEFAULT 50 NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan plan_type DEFAULT 'free' NOT NULL,
  max_members INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Team Members Table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- Categories Table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#588157',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, name)
);

-- Snippets Table
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  is_private BOOLEAN DEFAULT false NOT NULL,
  is_favorite BOOLEAN DEFAULT false NOT NULL,
  usage_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Snippet Usage Table
CREATE TABLE IF NOT EXISTS public.snippet_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'copy', 'edit', 'share')),
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- =============================================

-- Add missing columns to users table
DO $$
BEGIN
  -- Add snippet_count if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'snippet_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN snippet_count INTEGER DEFAULT 0 NOT NULL;
  END IF;

  -- Add max_snippets if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'max_snippets'
  ) THEN
    ALTER TABLE public.users ADD COLUMN max_snippets INTEGER DEFAULT 50 NOT NULL;
  END IF;

  -- Add email_verified if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'email_verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN email_verified BOOLEAN DEFAULT false;
  END IF;

  -- Add preferences if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE public.users ADD COLUMN preferences JSONB DEFAULT '{"theme": "dark", "notifications": true}'::jsonb;
  END IF;
END $$;

-- Add missing columns to teams table
DO $$
BEGIN
  -- Add slug if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'slug'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN slug TEXT;
    -- Generate slugs for existing teams
    UPDATE public.teams SET slug = 'team-' || id::text WHERE slug IS NULL;
    -- Now make it unique and not null
    ALTER TABLE public.teams ALTER COLUMN slug SET NOT NULL;
    CREATE UNIQUE INDEX IF NOT EXISTS teams_slug_key ON public.teams(slug);
  END IF;

  -- Add max_members if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'max_members'
  ) THEN
    ALTER TABLE public.teams ADD COLUMN max_members INTEGER DEFAULT 1 NOT NULL;
  END IF;
END $$;

-- Add missing columns to snippets table
DO $$
BEGIN
  -- Add is_favorite if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'is_favorite'
  ) THEN
    ALTER TABLE public.snippets ADD COLUMN is_favorite BOOLEAN DEFAULT false NOT NULL;
  END IF;

  -- Add is_private if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippets' AND column_name = 'is_private'
  ) THEN
    ALTER TABLE public.snippets ADD COLUMN is_private BOOLEAN DEFAULT false NOT NULL;
  END IF;
END $$;

-- Add team_id to snippet_usage if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippet_usage' AND column_name = 'team_id'
  ) THEN
    ALTER TABLE public.snippet_usage ADD COLUMN team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Rename created_at to timestamp in snippet_usage if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippet_usage' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'snippet_usage' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE public.snippet_usage RENAME COLUMN created_at TO timestamp;
  END IF;
END $$;

-- Rename created_at to timestamp in audit_logs if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'created_at'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'audit_logs' AND column_name = 'timestamp'
  ) THEN
    ALTER TABLE public.audit_logs RENAME COLUMN created_at TO timestamp;
  END IF;
END $$;

-- =============================================
-- CREATE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_snippets_team ON public.snippets(team_id);
CREATE INDEX IF NOT EXISTS idx_snippets_creator ON public.snippets(created_by);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON public.snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_category ON public.snippets(category_id);
CREATE INDEX IF NOT EXISTS idx_snippets_private ON public.snippets(is_private);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON public.snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON public.snippets USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_snippet ON public.snippet_usage(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_user ON public.snippet_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_created ON public.snippet_usage(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON public.audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(timestamp DESC);

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
-- DROP EXISTING POLICIES (CLEANUP)
-- =============================================

DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can delete their teams" ON public.teams;
DROP POLICY IF EXISTS "Team members can view team membership" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view categories" ON public.categories;
DROP POLICY IF EXISTS "Team members can create categories" ON public.categories;
DROP POLICY IF EXISTS "Users can view team snippets" ON public.snippets;
DROP POLICY IF EXISTS "Team members can create snippets" ON public.snippets;
DROP POLICY IF EXISTS "Users can create snippets in their teams" ON public.snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON public.snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON public.snippets;
DROP POLICY IF EXISTS "Snippet creators can update their snippets" ON public.snippets;
DROP POLICY IF EXISTS "Snippet creators can delete their snippets" ON public.snippets;
DROP POLICY IF EXISTS "Users can view their own usage" ON public.snippet_usage;
DROP POLICY IF EXISTS "Users can log snippet usage" ON public.snippet_usage;
DROP POLICY IF EXISTS "Team members can view team audit logs" ON public.audit_logs;

-- =============================================
-- CREATE RLS POLICIES
-- =============================================

-- Users policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = teams.id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team owners can update their teams" ON public.teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "Team owners can delete their teams" ON public.teams
  FOR DELETE USING (owner_id = auth.uid());

-- Team members policies
CREATE POLICY "Team members can view team membership" ON public.team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid()
    )
  );

-- Categories policies
CREATE POLICY "Team members can view categories" ON public.categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = categories.team_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create categories" ON public.categories
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = categories.team_id AND user_id = auth.uid()
    )
  );

-- Snippets policies
CREATE POLICY "Users can view team snippets" ON public.snippets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = snippets.team_id AND user_id = auth.uid()
    )
    OR (is_private = false)
  );

CREATE POLICY "Users can create snippets in their teams" ON public.snippets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = snippets.team_id AND user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Snippet creators can update their snippets" ON public.snippets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Snippet creators can delete their snippets" ON public.snippets
  FOR DELETE USING (created_by = auth.uid());

-- Snippet usage policies
CREATE POLICY "Users can view their own usage" ON public.snippet_usage
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can log snippet usage" ON public.snippet_usage
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Team members can view team audit logs" ON public.audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_id = audit_logs.team_id AND user_id = auth.uid()
    )
  );

-- =============================================
-- CREATE OR REPLACE FUNCTIONS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create user record and personal team on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  team_id UUID;
BEGIN
  -- Insert user record
  INSERT INTO public.users (id, email, full_name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.email_confirmed_at IS NOT NULL
  )
  ON CONFLICT (id) DO UPDATE
  SET email_verified = NEW.email_confirmed_at IS NOT NULL;

  -- Create personal team only if it doesn't exist
  INSERT INTO public.teams (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Team'),
    'team-' || NEW.id,
    NEW.id
  )
  ON CONFLICT (slug) DO NOTHING
  RETURNING id INTO team_id;

  -- Add user as team admin only if team was created
  IF team_id IS NOT NULL THEN
    INSERT INTO public.team_members (team_id, user_id, role)
    VALUES (team_id, NEW.id, 'admin'::user_role);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Update user snippet count
CREATE OR REPLACE FUNCTION update_user_snippet_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.users
    SET snippet_count = snippet_count + 1
    WHERE id = NEW.created_by;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.users
    SET snippet_count = GREATEST(snippet_count - 1, 0)
    WHERE id = OLD.created_by;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function: Log snippet usage
CREATE OR REPLACE FUNCTION log_snippet_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count logs to snippet_usage table
  IF TG_OP = 'UPDATE' AND NEW.usage_count > OLD.usage_count THEN
    INSERT INTO public.snippet_usage (snippet_id, user_id, team_id, action)
    VALUES (NEW.id, auth.uid(), NEW.team_id, 'copy');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Create default categories for new team
CREATE OR REPLACE FUNCTION create_default_categories(team_id_param UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.categories (team_id, name, color, icon) VALUES
    (team_id_param, 'Frontend', '#3178c6', '🎨'),
    (team_id_param, 'Backend', '#3776ab', '⚙️'),
    (team_id_param, 'Database', '#e38c00', '💾'),
    (team_id_param, 'DevOps', '#00ADD8', '🚀'),
    (team_id_param, 'Utils', '#A3B18A', '🔧'),
    (team_id_param, 'Algorithms', '#CE412B', '🧮')
  ON CONFLICT (team_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- DROP AND RECREATE TRIGGERS
-- =============================================

-- Drop existing triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS update_teams_updated_at ON public.teams;
DROP TRIGGER IF EXISTS update_snippets_updated_at ON public.snippets;
DROP TRIGGER IF EXISTS update_snippet_count_on_insert ON public.snippets;
DROP TRIGGER IF EXISTS update_snippet_count_on_delete ON public.snippets;
DROP TRIGGER IF EXISTS log_snippet_usage ON public.snippets;

-- Create triggers
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippet_count_on_insert
  AFTER INSERT ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_user_snippet_count();

CREATE TRIGGER update_snippet_count_on_delete
  AFTER DELETE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_user_snippet_count();

CREATE TRIGGER log_snippet_usage
  AFTER UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION log_snippet_action();

-- =============================================
-- FIX EXISTING DATA
-- =============================================

-- Update existing users to have proper defaults
UPDATE public.users
SET
  snippet_count = COALESCE(snippet_count, 0),
  max_snippets = COALESCE(max_snippets, 50),
  email_verified = COALESCE(email_verified, false),
  preferences = COALESCE(preferences, '{"theme": "dark", "notifications": true}'::jsonb)
WHERE snippet_count IS NULL OR max_snippets IS NULL OR email_verified IS NULL OR preferences IS NULL;

-- Update existing teams to have slugs (only if slug column exists and has nulls)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'teams' AND column_name = 'slug'
  ) THEN
    UPDATE public.teams
    SET slug = 'team-' || id::text
    WHERE slug IS NULL;
  END IF;
END $$;

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE '===========================================';
  RAISE NOTICE 'Database schema updated successfully!';
  RAISE NOTICE 'All tables, policies, and triggers are ready.';
  RAISE NOTICE 'Existing data has been preserved.';
  RAISE NOTICE '===========================================';
END $$;
