-- Fix wishlist_items UPDATE policy to allow marking items as purchased in shared wishlists
-- This fixes the circular dependency issue for UPDATE operations

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update items in their wishlists or mark as purchased" ON wishlist_items;
DROP POLICY IF EXISTS "users_update_items_in_accessible_wishlists" ON wishlist_items;

-- Create a new policy using EXISTS to avoid recursion issues
CREATE POLICY "users_update_items_in_accessible_wishlists"
  ON wishlist_items
  FOR UPDATE
  USING (
    -- Items from wishlists the user owns (can update anything)
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
    OR
    -- Items from shared wishlists where user has permission to mark as purchased
    EXISTS (
      SELECT 1 FROM wishlist_shares
      WHERE wishlist_shares.wishlist_id = wishlist_items.wishlist_id
      AND wishlist_shares.shared_with_user_id = auth.uid()
      AND wishlist_shares.can_mark_purchased = true
    )
  )
  WITH CHECK (
    -- Same check for the updated values
    wishlist_id IN (
      SELECT id FROM wishlists WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM wishlist_shares
      WHERE wishlist_shares.wishlist_id = wishlist_items.wishlist_id
      AND wishlist_shares.shared_with_user_id = auth.uid()
      AND wishlist_shares.can_mark_purchased = true
    )
  );
