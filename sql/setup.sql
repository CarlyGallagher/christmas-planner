-- ============================================
-- Christmas Planner - Complete Database Setup
-- Run this in Supabase SQL Editor (https://app.supabase.com)
-- Project: https://bwjaoxpbragnufktppzs.supabase.co
-- ============================================

-- ============================================
-- STEP 1: Create profiles table
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- STEP 2: Create wishlists tables
-- ============================================

-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  hide_purchased BOOLEAN DEFAULT false,
  share_token UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create wishlist_items table
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  url TEXT,
  image_url TEXT,
  price DECIMAL(10, 2),
  is_purchased BOOLEAN NOT NULL DEFAULT false,
  purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create wishlist_shares table
CREATE TABLE IF NOT EXISTS public.wishlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_mark_purchased BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wishlist_id, shared_with_user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_items_sort_order ON public.wishlist_items(wishlist_id, sort_order);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_wishlist_id ON public.wishlist_shares(wishlist_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_shares_user_id ON public.wishlist_shares(shared_with_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS wishlists_share_token_idx ON public.wishlists(share_token);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
DROP POLICY IF EXISTS "Users can view their own wishlists" ON public.wishlists;
CREATE POLICY "Users can view their own wishlists"
  ON public.wishlists
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR id IN (
      SELECT wishlist_id FROM public.wishlist_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert their own wishlists" ON public.wishlists;
CREATE POLICY "Users can insert their own wishlists"
  ON public.wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own wishlists" ON public.wishlists;
CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own wishlists" ON public.wishlists;
CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items
DROP POLICY IF EXISTS "Users can view items from accessible wishlists" ON public.wishlist_items;
CREATE POLICY "Users can view items from accessible wishlists"
  ON public.wishlist_items
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists
      WHERE user_id = auth.uid()
      OR id IN (
        SELECT wishlist_id FROM public.wishlist_shares
        WHERE shared_with_user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Users can insert items into their own wishlists" ON public.wishlist_items;
CREATE POLICY "Users can insert items into their own wishlists"
  ON public.wishlist_items
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update items in their wishlists or mark as purchased" ON public.wishlist_items;
CREATE POLICY "Users can update items in their wishlists or mark as purchased"
  ON public.wishlist_items
  FOR UPDATE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
    OR (
      wishlist_id IN (
        SELECT wishlist_id FROM public.wishlist_shares
        WHERE shared_with_user_id = auth.uid() AND can_mark_purchased = true
      )
    )
  )
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
    OR (
      wishlist_id IN (
        SELECT wishlist_id FROM public.wishlist_shares
        WHERE shared_with_user_id = auth.uid() AND can_mark_purchased = true
      )
    )
  );

DROP POLICY IF EXISTS "Users can delete items from their own wishlists" ON public.wishlist_items;
CREATE POLICY "Users can delete items from their own wishlists"
  ON public.wishlist_items
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for wishlist_shares
DROP POLICY IF EXISTS "Users can view shares for accessible wishlists" ON public.wishlist_shares;
CREATE POLICY "Users can view shares for accessible wishlists"
  ON public.wishlist_shares
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
    OR shared_with_user_id = auth.uid()
  );

DROP POLICY IF EXISTS "Users can share their own wishlists" ON public.wishlist_shares;
CREATE POLICY "Users can share their own wishlists"
  ON public.wishlist_shares
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete shares from their own wishlists" ON public.wishlist_shares;
CREATE POLICY "Users can delete shares from their own wishlists"
  ON public.wishlist_shares
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Trigger to automatically update updated_at on wishlists
DROP TRIGGER IF EXISTS update_wishlists_updated_at ON public.wishlists;
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generate share tokens for existing wishlists
UPDATE public.wishlists
SET share_token = gen_random_uuid()
WHERE share_token IS NULL;

-- ============================================
-- STEP 3: Create storage bucket for wishlist images
-- ============================================

-- Create bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wishlist-images',
  'wishlist-images',
  true,
  5242880, -- 5MB limit
  ARRAY[
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
)
ON CONFLICT (id) DO UPDATE SET
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies for wishlist-images bucket
DROP POLICY IF EXISTS "Anyone can view wishlist images" ON storage.objects;
CREATE POLICY "Anyone can view wishlist images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'wishlist-images');

DROP POLICY IF EXISTS "Authenticated users can upload wishlist images" ON storage.objects;
CREATE POLICY "Authenticated users can upload wishlist images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'wishlist-images'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Users can update their own wishlist images" ON storage.objects;
CREATE POLICY "Users can update their own wishlist images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users can delete their own wishlist images" ON storage.objects;
CREATE POLICY "Users can delete their own wishlist images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'wishlist-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ============================================
-- Verification
-- ============================================

SELECT 'Setup complete! Tables created:' as status;
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'wishlists', 'wishlist_items', 'wishlist_shares')
ORDER BY table_name;
