-- Restore missing INSERT, UPDATE, and DELETE policies for wishlist_shares
-- These were accidentally omitted in the RLS recursion fix

-- INSERT: Users can create shares for their own wishlists
DROP POLICY IF EXISTS "Users can share their own wishlists" ON wishlist_shares;
DROP POLICY IF EXISTS "users_insert_wishlist_shares" ON wishlist_shares;

CREATE POLICY "users_insert_wishlist_shares"
  ON wishlist_shares
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  );

-- UPDATE: Users can update shares for their own wishlists
DROP POLICY IF EXISTS "Users can update shares for their own wishlists" ON wishlist_shares;
DROP POLICY IF EXISTS "users_update_wishlist_shares" ON wishlist_shares;

CREATE POLICY "users_update_wishlist_shares"
  ON wishlist_shares
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  );

-- DELETE: Users can delete shares from their own wishlists
DROP POLICY IF EXISTS "Users can delete shares from their own wishlists" ON wishlist_shares;
DROP POLICY IF EXISTS "users_delete_wishlist_shares" ON wishlist_shares;

CREATE POLICY "users_delete_wishlist_shares"
  ON wishlist_shares
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
  );
