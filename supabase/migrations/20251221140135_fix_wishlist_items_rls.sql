-- Fix wishlist_items RLS policy to allow viewing items from shared wishlists
-- This fixes the same circular dependency issue we had with wishlists

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view items from accessible wishlists" ON wishlist_items;

-- Create a new policy using EXISTS to avoid recursion issues
CREATE POLICY "users_view_items_from_accessible_wishlists"
  ON wishlist_items
  FOR SELECT
  USING (
    -- Items from wishlists the user owns
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
    OR
    -- Items from wishlists shared with the user
    EXISTS (
      SELECT 1 FROM wishlist_shares
      WHERE wishlist_shares.wishlist_id = wishlist_items.wishlist_id
      AND wishlist_shares.shared_with_user_id = auth.uid()
    )
  );
