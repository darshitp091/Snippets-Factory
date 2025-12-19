# Snippet Factory - Database Setup Guide

This guide will walk you through setting up the Supabase database for Snippet Factory.

## Prerequisites

1. A Supabase account ([https://supabase.com](https://supabase.com))
2. A new Supabase project created
3. Your Supabase project URL and anon key

## Environment Variables

Create a `.env.local` file in the root of your project with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Database Schema Setup

### Step 1: Access Supabase SQL Editor

1. Log in to your Supabase dashboard
2. Select your project
3. Navigate to the SQL Editor (database icon on the left sidebar)
4. Click "New Query"

### Step 2: Run the Database Schema

Copy and paste the following SQL schema into the SQL Editor and click "Run":

```sql
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
```

### Step 3: Set Up Auth Triggers

This trigger automatically creates a user record when someone signs up:

```sql
-- Function to create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name'
  );

  -- Create a personal team for the user
  INSERT INTO public.teams (name, owner_id, plan)
  VALUES (
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'My Team'),
    NEW.id,
    'free'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Step 4: Configure Authentication Settings

1. Go to **Authentication** → **Providers** in your Supabase dashboard
2. Enable **Email** provider
3. Configure **Email Templates** (optional):
   - Confirmation email
   - Password reset email
4. Enable **GitHub OAuth** (optional):
   - Add your GitHub OAuth app credentials
   - Set redirect URL to: `https://your-domain.com/auth/callback`

### Step 5: Email Confirmation Settings

1. Go to **Authentication** → **Settings**
2. Under **Email Auth**:
   - Enable "Confirm email"
   - Set "Site URL" to your production domain
   - Add redirect URLs for development: `http://localhost:3000`

## Plan-Based Feature Access

The system supports three plans:
- **Free**: Basic features, limited snippets
- **Pro**: Advanced features, unlimited snippets, team collaboration
- **Enterprise**: All features, advanced security, audit logs

Plan enforcement is handled in the application layer. The database stores the plan in the `users.plan` column.

## Testing the Setup

1. Try signing up a new user via the app
2. Check the Supabase dashboard → **Authentication** → **Users** to see the new user
3. Check the **Table Editor** → **users** table to verify the user profile was created
4. Check the **teams** table to verify a team was auto-created

## Common Issues

### Issue: User profile not created on signup
**Solution**: Make sure the trigger `on_auth_user_created` is created and enabled

### Issue: RLS policies blocking access
**Solution**: Check that you're authenticated when testing. Use Supabase dashboard to temporarily disable RLS for debugging.

### Issue: Email confirmation not working
**Solution**:
- Check email settings in Supabase dashboard
- Verify SMTP settings if using custom email
- Check spam folder for confirmation emails

## Next Steps

After setting up the database:

1. Test user signup and login
2. Implement snippet creation/editing
3. Add team management features
4. Set up plan-based access control
5. Implement analytics tracking

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the codebase in `src/lib/supabase.ts`
- Check authentication flow in `src/app/signup/page.tsx` and `src/app/login/page.tsx`
