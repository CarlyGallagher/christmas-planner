-- Fix wishlist RLS policies to eliminate infinite recursion
-- This migration removes circular dependencies between wishlists and wishlist_shares

-- Drop all existing RLS policies on wishlists
DROP POLICY IF EXISTS "Users can view their own wishlists" ON wishlists;
DROP POLICY IF EXISTS "Users can view wishlists shared with them" ON wishlists;
DROP POLICY IF EXISTS "view_owned_and_shared_wishlists" ON wishlists;

-- Drop all existing RLS policies on wishlist_shares
DROP POLICY IF EXISTS "Users can view shares for accessible wishlists" ON wishlist_shares;
DROP POLICY IF EXISTS "Users can view their shares" ON wishlist_shares;
DROP POLICY IF EXISTS "Owners can view shares of their wishlists" ON wishlist_shares;
DROP POLICY IF EXISTS "Anyone authenticated can view shares" ON wishlist_shares;
DROP POLICY IF EXISTS "authenticated_can_view_shares" ON wishlist_shares;
DROP POLICY IF EXISTS "authenticated_users_view_shares" ON wishlist_shares;

-- STEP 1: Make wishlist_shares readable by all authenticated users
-- This breaks the circular dependency (no reference to wishlists table)
CREATE POLICY "authenticated_users_view_shares"
  ON wishlist_shares
  FOR SELECT
  TO authenticated
  USING (true);

-- STEP 2: Allow wishlists to be viewed by owner OR users it's shared with
-- This can now safely reference wishlist_shares without causing recursion
CREATE POLICY "users_view_owned_and_shared_wishlists"
  ON wishlists
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM wishlist_shares
      WHERE wishlist_shares.wishlist_id = wishlists.id
      AND wishlist_shares.shared_with_user_id = auth.uid()
    )
  );
