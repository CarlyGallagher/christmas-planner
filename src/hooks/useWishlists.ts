'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Wishlist, WishlistItem } from '@/types';

export function useWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWishlists = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's wishlists - RLS policies handle access control
    const { data, error } = await supabase
      .from('wishlists')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setWishlists(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWishlists();
  }, []);

  return { wishlists, loading, refetch: fetchWishlists };
}

export function useWishlistItems(wishlistId: string) {
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('wishlist_items')
      .select('*')
      .eq('wishlist_id', wishlistId)
      .order('sort_order', { ascending: true });

    if (!error && data) {
      setItems(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (wishlistId) {
      fetchItems();
    }
  }, [wishlistId]);

  return { items, loading, refetch: fetchItems };
}
