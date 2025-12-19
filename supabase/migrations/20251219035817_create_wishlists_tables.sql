-- Create wishlists table
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
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

-- Create wishlist_shares table (for sharing wishlists with others)
CREATE TABLE IF NOT EXISTS public.wishlist_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wishlist_id UUID NOT NULL REFERENCES public.wishlists(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_mark_purchased BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wishlist_id, shared_with_user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_wishlists_user_id ON public.wishlists(user_id);
CREATE INDEX idx_wishlist_items_wishlist_id ON public.wishlist_items(wishlist_id);
CREATE INDEX idx_wishlist_items_sort_order ON public.wishlist_items(wishlist_id, sort_order);
CREATE INDEX idx_wishlist_shares_wishlist_id ON public.wishlist_shares(wishlist_id);
CREATE INDEX idx_wishlist_shares_user_id ON public.wishlist_shares(shared_with_user_id);

-- Enable Row Level Security
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wishlists
-- Users can view their own wishlists and wishlists shared with them
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

-- Users can insert their own wishlists
CREATE POLICY "Users can insert their own wishlists"
  ON public.wishlists
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own wishlists
CREATE POLICY "Users can update their own wishlists"
  ON public.wishlists
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlists
CREATE POLICY "Users can delete their own wishlists"
  ON public.wishlists
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for wishlist_items
-- Users can view items from their wishlists or shared wishlists
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

-- Users can insert items into their own wishlists
CREATE POLICY "Users can insert items into their own wishlists"
  ON public.wishlist_items
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Users can update items in their own wishlists
-- OR mark items as purchased in wishlists shared with them (if allowed)
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

-- Users can delete items from their own wishlists
CREATE POLICY "Users can delete items from their own wishlists"
  ON public.wishlist_items
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- RLS Policies for wishlist_shares
-- Users can view shares for their own wishlists or wishlists shared with them
CREATE POLICY "Users can view shares for accessible wishlists"
  ON public.wishlist_shares
  FOR SELECT
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
    OR shared_with_user_id = auth.uid()
  );

-- Users can create shares for their own wishlists
CREATE POLICY "Users can share their own wishlists"
  ON public.wishlist_shares
  FOR INSERT
  WITH CHECK (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Users can delete shares from their own wishlists
CREATE POLICY "Users can delete shares from their own wishlists"
  ON public.wishlist_shares
  FOR DELETE
  USING (
    wishlist_id IN (
      SELECT id FROM public.wishlists WHERE user_id = auth.uid()
    )
  );

-- Trigger to automatically update updated_at on wishlists
CREATE TRIGGER update_wishlists_updated_at
  BEFORE UPDATE ON public.wishlists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
