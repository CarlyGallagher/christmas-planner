-- ============================================
-- Fix Infinite Recursion in RLS Policies
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can insert their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;

DROP POLICY IF EXISTS "Users can view items from accessible wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can insert items into their own wishlists" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can update items in their wishlists or mark as purchased" ON public.wishlist_items;
DROP POLICY IF EXISTS "Users can delete items from their own wishlists" ON public.wishlist_items;

DROP POLICY IF EXISTS "Users can view shares for accessible wishlists" ON public.wishlist_shares;
DROP POLICY IF EXISTS "Users can share their own wishlists" ON public.wishlist_shares;
DROP POLICY IF EXISTS "Users can delete shares from their own wishlists" ON public.wishlist_shares;

-- ============================================
-- Create FIXED RLS Policies (no circular references)
-- ============================================

-- WISHLISTS: Simple policies without subqueries to wishlist_shares
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own wishlists"
  ON public.wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- WISHLIST_SHARES: Simple policies
CREATE POLICY "Users can view their own shares"
  ON public.wishlist_shares
  FOR SELECT
  USING (shared_with_user_id = auth.uid());

CREATE POLICY "Owners can view shares of their wishlists"
  ON public.wishlist_shares
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can share their own wishlists"
  ON public.wishlist_shares
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete shares from their own wishlists"
  ON public.wishlist_shares
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- WISHLIST_ITEMS: Policies that check both ownership and shares
CREATE POLICY "Users can view items from their own wishlists"
  ON public.wishlist_items
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view items from shared wishlists"
  ON public.wishlist_items
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT wishlist_id FROM public.wishlist_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items into their own wishlists"
  ON public.wishlist_items
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items in their own wishlists"
  ON public.wishlist_items
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can mark items purchased in shared wishlists"
  ON public.wishlist_items
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT wishlist_id FROM public.wishlist_shares
      WHERE shared_with_user_id = auth.uid() AND can_mark_purchased = true
    )
  );

CREATE POLICY "Users can delete items from their own wishlists"
  ON public.wishlist_items
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Verify policies are created
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_shares')
ORDER BY tablename, policyname;
