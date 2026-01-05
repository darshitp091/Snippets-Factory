-- ============================================================================
-- Fix Critical Issue: Snippet Privacy Field Naming Mismatch
-- ============================================================================
-- PROBLEM: Database uses 'is_public' but frontend expects 'is_private'
-- SOLUTION: Rename database column to match frontend expectations
--
-- Current state:
--   - Database: is_public (TRUE = public, FALSE = private)
--   - Frontend: is_private (TRUE = private, FALSE = public)
--
-- After this migration:
--   - Database: is_private (TRUE = private, FALSE = public)
--   - Frontend: is_private (TRUE = private, FALSE = public)
--   - ✅ CONSISTENT!
-- ============================================================================

-- Step 1: Drop old policies that depend on is_public FIRST
DROP POLICY IF EXISTS "Users can view public snippets" ON snippets;
DROP POLICY IF EXISTS "Users can view their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can insert their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update their own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete their own snippets" ON snippets;
DROP POLICY IF EXISTS "Team members can view team snippets" ON snippets;

-- Step 2: Add new column 'is_private' with inverted logic
ALTER TABLE snippets
ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT TRUE;

-- Step 3: Copy and invert the data from is_public to is_private
-- is_public = TRUE  → is_private = FALSE (public snippet)
-- is_public = FALSE → is_private = TRUE  (private snippet)
UPDATE snippets
SET is_private = NOT COALESCE(is_public, FALSE);

-- Step 4: Now we can safely drop the old is_public column
ALTER TABLE snippets
DROP COLUMN IF EXISTS is_public;

-- Step 5: Create new RLS policies using is_private

-- Policy 1: Users can view snippets that are NOT private (is_private = FALSE)
CREATE POLICY "Users can view public snippets"
  ON snippets
  FOR SELECT
  USING (is_private = FALSE);

-- Policy 2: Users can view their own snippets (regardless of privacy)
CREATE POLICY "Users can view their own snippets"
  ON snippets
  FOR SELECT
  USING (auth.uid() = created_by);

-- Policy 3: Team members can view team snippets
CREATE POLICY "Team members can view team snippets"
  ON snippets
  FOR SELECT
  USING (
    team_id IN (
      SELECT team_id
      FROM team_members
      WHERE user_id = auth.uid()
    )
  );

-- Policy 4: Users can insert their own snippets
CREATE POLICY "Users can insert their own snippets"
  ON snippets
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Policy 5: Users can update their own snippets
CREATE POLICY "Users can update their own snippets"
  ON snippets
  FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- Policy 6: Users can delete their own snippets
CREATE POLICY "Users can delete their own snippets"
  ON snippets
  FOR DELETE
  USING (auth.uid() = created_by);

-- Step 6: Add index for performance on is_private lookups
CREATE INDEX IF NOT EXISTS idx_snippets_is_private
ON snippets(is_private)
WHERE is_private = FALSE; -- Partial index for public snippets

-- Step 7: Add helpful comment
COMMENT ON COLUMN snippets.is_private IS
  'Privacy setting for snippet. TRUE = private (only visible to owner/team), FALSE = public (visible to everyone)';

-- ============================================================================
-- Verification Query
-- ============================================================================
-- After migration, run this to verify:
-- SELECT id, title, is_private, created_by FROM snippets LIMIT 10;
--
-- Expected results:
-- - is_private = TRUE  → Private snippet (only owner can see)
-- - is_private = FALSE → Public snippet (everyone can see)
-- ============================================================================
