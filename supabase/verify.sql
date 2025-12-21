-- =============================================
-- VERIFICATION SCRIPT
-- =============================================
-- Run this AFTER complete_schema.sql to verify
-- everything was created correctly
-- =============================================

-- Check 1: List all tables
SELECT
  '📊 Tables' as category,
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Check 2: List all triggers
SELECT
  '⚡ Triggers' as category,
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  CASE t.tgenabled
    WHEN 'O' THEN 'ENABLED'
    WHEN 'D' THEN 'DISABLED'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE NOT t.tgisinternal
  AND c.relname IN ('users', 'teams', 'snippets', 'auth')
ORDER BY c.relname, t.tgname;

-- Check 3: List all policies
SELECT
  '🔒 RLS Policies' as category,
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- Check 4: Count everything
SELECT
  'Summary' as category,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as tables,
  (SELECT COUNT(*) FROM pg_trigger t JOIN pg_class c ON t.tgrelid = c.oid WHERE NOT t.tgisinternal AND c.relnamespace = 'public'::regnamespace) as triggers,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public') as policies,
  (SELECT COUNT(*) FROM pg_proc WHERE pronamespace = 'public'::regnamespace) as functions;

-- Check 5: Test if trigger function exists
SELECT
  '✅ Critical Function Check' as category,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user') THEN 'PASS - handle_new_user() exists'
    ELSE 'FAIL - handle_new_user() missing'
  END as status;

-- Check 6: Test if trigger is active
SELECT
  '✅ Critical Trigger Check' as category,
  CASE
    WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN 'PASS - Trigger is active'
    ELSE 'FAIL - Trigger is missing'
  END as status;
