-- ============================================
-- Christmas Planner - Database Setup Script
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add columns to wishlists table (safe - won't fail if already exists)
DO $$
BEGIN
  -- Add hide_purchased column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'hide_purchased'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN hide_purchased boolean DEFAULT false;
  END IF;

  -- Add share_token column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN share_token uuid;
  END IF;
END $$;

-- Step 2: Generate share tokens for existing wishlists that don't have one
UPDATE wishlists
SET share_token = gen_random_uuid()
WHERE share_token IS NULL;

-- Step 3: Create unique index on share_token (safe - won't fail if exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'wishlists_share_token_idx'
  ) THEN
    CREATE UNIQUE INDEX wishlists_share_token_idx ON wishlists(share_token);
  END IF;
END $$;

-- Step 4: Update storage bucket to allow more image formats
UPDATE storage.buckets
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'image/bmp',
  'image/tiff',
  'image/svg+xml',
  'image/avif'
]
WHERE id = 'wishlist-images';

-- Step 5: Verify the changes
SELECT
  column_name,
  data_type,
  column_default,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'wishlists'
  AND column_name IN ('hide_purchased', 'share_token')
ORDER BY column_name;
