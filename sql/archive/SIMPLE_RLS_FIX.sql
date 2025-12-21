-- ============================================
-- Simple RLS Fix - Remove ALL policies temporarily
-- Then add back only the most basic ones
-- ============================================

-- Disable RLS temporarily to clear everything
ALTER TABLE public.wishlists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_shares DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_shares'))
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Add ONLY the simplest policies - NO circular references
-- ============================================

-- WISHLISTS: Only show user's own wishlists (no shared logic yet)
CREATE POLICY "wishlists_select_own"
  ON public.wishlists
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "wishlists_insert_own"
  ON public.wishlists
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_update_own"
  ON public.wishlists
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "wishlists_delete_own"
  ON public.wishlists
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- WISHLIST_ITEMS: Simple ownership check
CREATE POLICY "items_select_own"
  ON public.wishlist_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "items_insert_own"
  ON public.wishlist_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "items_update_own"
  ON public.wishlist_items
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "items_delete_own"
  ON public.wishlist_items
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_items.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

-- WISHLIST_SHARES: Simple policies
CREATE POLICY "shares_select_own"
  ON public.wishlist_shares
  FOR SELECT
  TO authenticated
  USING (
    shared_with_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_shares.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "shares_insert_own"
  ON public.wishlist_shares
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_shares.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

CREATE POLICY "shares_delete_own"
  ON public.wishlist_shares
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.wishlists
      WHERE wishlists.id = wishlist_shares.wishlist_id
      AND wishlists.user_id = auth.uid()
    )
  );

-- Verify
SELECT 'Policies recreated!' as status;
SELECT tablename, policyname FROM pg_policies
WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_shares')
ORDER BY tablename, policyname;
