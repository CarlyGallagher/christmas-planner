'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import Image from 'next/image';
import type { Wishlist, WishlistItem } from '@/types';

export default function SharedWishlistPage() {
  const params = useParams();
  const token = params.token as string;
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetchWishlist = async () => {
      setLoading(true);

      // Fetch wishlist by share token
      const { data: wishlistData, error: wishlistError } = await supabase
        .from('wishlists')
        .select('*')
        .eq('share_token', token)
        .single();

      if (wishlistError || !wishlistData) {
        setLoading(false);
        return;
      }

      setWishlist(wishlistData);

      // Fetch items for this wishlist
      const { data: itemsData, error: itemsError } = await supabase
        .from('wishlist_items')
        .select('*')
        .eq('wishlist_id', wishlistData.id)
        .eq('is_purchased', false) // Only show unpurchased items on public view
        .order('sort_order', { ascending: true });

      if (!itemsError && itemsData) {
        setItems(itemsData);
      }

      setLoading(false);
    };

    if (token) {
      fetchWishlist();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Loading wishlist...</p>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Gift className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Wishlist Not Found</h1>
          <p className="text-gray-600">
            This wishlist link may be invalid or has been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center px-4">
          <div className="text-xl font-bold text-green-600">
            🎄 Christmas Planner
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{wishlist.name}</h1>
            <p className="text-gray-600">
              Shared Christmas wishlist
            </p>
          </div>

          {items.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Gift className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No items available</h3>
                <p className="text-gray-600 text-center">
                  This wishlist doesn't have any items yet, or all items have been purchased.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id}>
                  <div className="p-4">
                    {item.image_url && (
                      <div className="relative w-full h-48 mb-4 rounded-md overflow-hidden bg-gray-100">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <h3 className="text-lg font-semibold mb-2">{item.name}</h3>
                    {item.price && item.price > 0 && (
                      <p className="text-green-600 font-semibold mb-2">
                        ${item.price.toFixed(2)}
                      </p>
                    )}
                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                    )}
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        View Product →
                      </a>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
