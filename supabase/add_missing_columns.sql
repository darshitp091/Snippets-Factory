-- =============================================
-- ADD MISSING COLUMNS TO USERS TABLE
-- =============================================
-- Run this if you get 400 errors about snippet_count or max_snippets
-- =============================================

-- Add snippet_count column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'snippet_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN snippet_count INTEGER DEFAULT 0;
    RAISE NOTICE '✓ Added snippet_count column';
  ELSE
    RAISE NOTICE '- snippet_count column already exists';
  END IF;
END $$;

-- Add max_snippets column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'max_snippets'
  ) THEN
    ALTER TABLE public.users ADD COLUMN max_snippets INTEGER DEFAULT 50;
    RAISE NOTICE '✓ Added max_snippets column';
  ELSE
    RAISE NOTICE '- max_snippets column already exists';
  END IF;
END $$;

-- Update existing users to have default values
UPDATE public.users
SET
  snippet_count = COALESCE(snippet_count, 0),
  max_snippets = COALESCE(max_snippets, 50)
WHERE snippet_count IS NULL OR max_snippets IS NULL;

-- Verify columns exist
SELECT
  column_name,
  data_type,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'users'
  AND column_name IN ('snippet_count', 'max_snippets');

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Missing columns have been added!';
END $$;
