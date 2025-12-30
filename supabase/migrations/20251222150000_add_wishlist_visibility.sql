-- Add is_public column to wishlists table for public/private visibility
-- is_public = true means anyone can view the wishlist
-- is_public = false (default) means only owner and explicitly shared users can view

ALTER TABLE public.wishlists
ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Update RLS policy to allow viewing public wishlists
DROP POLICY IF EXISTS "users_view_owned_and_shared_wishlists" ON wishlists;
DROP POLICY IF EXISTS "users_view_owned_shared_and_public_wishlists" ON wishlists;

CREATE POLICY "users_view_owned_shared_and_public_wishlists"
  ON wishlists
  FOR SELECT
  USING (
    -- Own wishlists
    auth.uid() = user_id
    OR
    -- Wishlists shared with the user
    EXISTS (
      SELECT 1 FROM wishlist_shares
      WHERE wishlist_shares.wishlist_id = wishlists.id
      AND wishlist_shares.shared_with_user_id = auth.uid()
    )
    OR
    -- Public wishlists
    is_public = true
  );

-- Create index for public wishlist queries
CREATE INDEX IF NOT EXISTS idx_wishlists_is_public ON public.wishlists(is_public) WHERE is_public = true;
