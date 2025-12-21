-- ============================================
-- Diagnostic Script - Check current state
-- ============================================

-- Check all current policies
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('wishlists', 'wishlist_items', 'wishlist_shares')
ORDER BY tablename, policyname;

-- Check if RLS is enabled
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('wishlists', 'wishlist_items', 'wishlist_shares');

-- Check table structure
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'wishlists'
  AND table_schema = 'public'
ORDER BY ordinal_position;
