import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Schema SQL (to be executed in Supabase SQL Editor)
export const DATABASE_SCHEMA = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members table
CREATE TABLE IF NOT EXISTS public.team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);

-- Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  color TEXT DEFAULT '#8b5cf6',
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snippets table
CREATE TABLE IF NOT EXISTS public.snippets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  code TEXT NOT NULL,
  language TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT FALSE,
  placeholders JSONB DEFAULT '[]',
  usage_count INTEGER DEFAULT 0,
  popularity_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Snippet usage tracking
CREATE TABLE IF NOT EXISTS public.snippet_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  snippet_id UUID REFERENCES public.snippets(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('view', 'copy', 'edit', 'create')),
  metadata JSONB DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('snippet', 'team', 'user', 'category')),
  resource_id UUID,
  changes JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_snippets_team_id ON public.snippets(team_id);
CREATE INDEX IF NOT EXISTS idx_snippets_created_by ON public.snippets(created_by);
CREATE INDEX IF NOT EXISTS idx_snippets_category_id ON public.snippets(category_id);
CREATE INDEX IF NOT EXISTS idx_snippets_language ON public.snippets(language);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_snippet_id ON public.snippet_usage(snippet_id);
CREATE INDEX IF NOT EXISTS idx_snippet_usage_user_id ON public.snippet_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_team_id ON public.audit_logs(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON public.team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON public.team_members(user_id);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.snippet_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Users
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for Teams
CREATE POLICY "Team members can view their teams" ON public.teams
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

-- RLS Policies for Snippets
CREATE POLICY "Users can view team snippets" ON public.snippets
  FOR SELECT USING (
    is_public = TRUE OR
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = snippets.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can create snippets" ON public.snippets
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.team_members
      WHERE team_members.team_id = snippets.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own snippets" ON public.snippets
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own snippets" ON public.snippets
  FOR DELETE USING (created_by = auth.uid());

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at BEFORE UPDATE ON public.snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;
