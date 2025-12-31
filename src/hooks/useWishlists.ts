'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Wishlist, WishlistItem } from '@/types';

export function useWishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [sharedWishlists, setSharedWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchWishlists = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get user's owned wishlists
    const { data: ownedData, error: ownedError } = await supabase
      .from('wishlists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!ownedError && ownedData) {
      setWishlists(ownedData);
    }

    // Get wishlists shared with the user
    // First get the wishlist IDs from wishlist_shares
    const { data: shareData, error: shareError } = await supabase
      .from('wishlist_shares')
      .select('wishlist_id')
      .eq('shared_with_user_id', user.id);

    if (!shareError && shareData && shareData.length > 0) {
      // Then fetch the actual wishlist data using those IDs, including owner profile
      const wishlistIds = shareData.map(share => share.wishlist_id);
      const { data: sharedData, error: sharedError } = await supabase
        .from('wishlists')
        .select(`
          *,
          owner_profile:profiles!wishlists_user_id_fkey(
            id,
            display_name,
            avatar_url
          )
        `)
        .in('id', wishlistIds)
        .order('created_at', { ascending: false });

      if (!sharedError && sharedData) {
        setSharedWishlists(sharedData);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchWishlists();
  }, []);

  return { wishlists, sharedWishlists, loading, refetch: fetchWishlists };
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
