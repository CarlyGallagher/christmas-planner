-- Restore missing INSERT, UPDATE, and DELETE policies for wishlists
-- These were accidentally not included in the previous RLS fix

-- DROP existing policies if they exist to avoid duplicates
DROP POLICY IF EXISTS "Users can insert their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON wishlists;

-- INSERT: Users can create their own wishlists
CREATE POLICY "users_insert_own_wishlists"
  ON wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- UPDATE: Users can update their own wishlists
CREATE POLICY "users_update_own_wishlists"
  ON wishlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- DELETE: Users can delete their own wishlists
CREATE POLICY "users_delete_own_wishlists"
  ON wishlists
  FOR DELETE
  USING (auth.uid() = user_id);
