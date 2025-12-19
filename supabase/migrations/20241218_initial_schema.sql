-- Snippet Factory Database Schema
-- Execute this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
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
-- USERS TABLE
-- =============================================
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

-- =============================================
-- TEAMS TABLE
-- =============================================
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

-- =============================================
-- TEAM MEMBERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'member' NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- =============================================
-- CATEGORIES TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#588157',
  icon TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(team_id, name)
);

-- =============================================
-- SNIPPETS TABLE
-- =============================================
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

-- =============================================
-- SNIPPET USAGE TRACKING
-- =============================================
CREATE TABLE IF NOT EXISTS public.snippet_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID NOT NULL REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'copy', 'edit', 'share')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- AUDIT LOGS
-- =============================================
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
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_plan ON public.users(plan);

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner ON public.teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_teams_slug ON public.teams(slug);

-- Team members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON public.team_members(user_id);

-- Snippets indexes
CREATE INDEX IF NOT EXISTS idx_snippets_team ON public.snippets(team_id);
CREATE INDEX IF NOT EXISTS idx_snippets_creator ON public.snippets(created_by);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON public.snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippets_category ON public.snippets(category_id);
CREATE INDEX IF NOT EXISTS idx_snippets_private ON public.snippets(is_private);
CREATE INDEX IF NOT EXISTS idx_snippets_created ON public.snippets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_tags ON public.snippets USING GIN(tags);

-- Snippet usage indexes
CREATE INDEX IF NOT EXISTS idx_snippet_usage_snippet ON public.snippet_usage(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_user ON public.snippet_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_created ON public.snippet_usage(created_at DESC);

-- Audit logs indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_team ON public.audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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
-- FUNCTIONS AND TRIGGERS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at BEFORE UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

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
    NEW.raw_user_meta_data->>'full_name',
    NEW.email_confirmed_at IS NOT NULL
  );

  -- Create personal team
  INSERT INTO public.teams (name, slug, owner_id)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Team'),
    'team-' || NEW.id,
    NEW.id
  )
  RETURNING id INTO team_id;

  -- Add user as team admin
  INSERT INTO public.team_members (team_id, user_id, role)
  VALUES (team_id, NEW.id, 'admin');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Create user and team on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

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
    SET snippet_count = snippet_count - 1
    WHERE id = OLD.created_by;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Update snippet count on insert/delete
CREATE TRIGGER update_snippet_count_on_insert
  AFTER INSERT ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_user_snippet_count();

CREATE TRIGGER update_snippet_count_on_delete
  AFTER DELETE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_user_snippet_count();

-- Function: Log snippet usage
CREATE OR REPLACE FUNCTION log_snippet_action()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment usage count
  IF TG_OP = 'UPDATE' AND NEW.usage_count > OLD.usage_count THEN
    INSERT INTO public.snippet_usage (snippet_id, user_id, action)
    VALUES (NEW.id, auth.uid(), 'copy');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Log snippet usage
CREATE TRIGGER log_snippet_usage
  AFTER UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION log_snippet_action();

-- =============================================
-- DEFAULT CATEGORIES
-- =============================================

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
-- GRANT PERMISSIONS
-- =============================================

-- Grant access to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'All tables, indexes, RLS policies, and triggers are in place.';
  RAISE NOTICE 'New users will automatically get a user record and personal team.';
END $$;
