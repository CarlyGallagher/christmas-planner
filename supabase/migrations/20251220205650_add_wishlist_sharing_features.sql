-- Add hide_purchased column to wishlists table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'hide_purchased'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN hide_purchased boolean DEFAULT false;
  END IF;
END $$;

-- Add share_token column for public link sharing if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'wishlists' AND column_name = 'share_token'
  ) THEN
    ALTER TABLE wishlists ADD COLUMN share_token uuid DEFAULT gen_random_uuid();
  END IF;
END $$;

-- Create unique index on share_token if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'wishlists_share_token_idx'
  ) THEN
    CREATE UNIQUE INDEX wishlists_share_token_idx ON wishlists(share_token);
  END IF;
END $$;

-- Drop existing public read policy if exists
DROP POLICY IF EXISTS "Allow public read access via share token" ON wishlists;

-- Add RLS policy to allow public access via share token
CREATE POLICY "Allow public read access via share token"
ON wishlists
FOR SELECT
USING (share_token IS NOT NULL);

-- Drop existing public items read policy if exists
DROP POLICY IF EXISTS "Allow public read of items via share token" ON wishlist_items;

-- Add RLS policy to allow public read of wishlist items via share token
CREATE POLICY "Allow public read of items via share token"
ON wishlist_items
FOR SELECT
USING (
  wishlist_id IN (
    SELECT id FROM wishlists WHERE share_token IS NOT NULL
  )
);
