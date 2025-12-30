'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, ExternalLink, Trash2, Edit } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { WishlistItem } from '@/types';

interface WishlistItemCardProps {
  item: WishlistItem;
  isOwner: boolean;
  hidePurchased?: boolean;
  onUpdate: () => void;
}

export function WishlistItemCard({ item, isOwner, hidePurchased = false, onUpdate }: WishlistItemCardProps) {
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  // If owner has hide_purchased enabled, don't show purchase status
  const shouldHidePurchaseStatus = hidePurchased && item.is_purchased;

  const handleTogglePurchased = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to mark items as purchased');
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from('wishlist_items')
      .update({
        is_purchased: !item.is_purchased,
        purchased_by: !item.is_purchased ? user.id : null,
      })
      .eq('id', item.id);

    if (error) {
      alert('Failed to update item: ' + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onUpdate();
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this item?')) {
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      alert('You must be logged in to delete items');
      setLoading(false);
      return;
    }

    // Verify ownership of the wishlist
    const { data: wishlist, error: wishlistError } = await supabase
      .from('wishlists')
      .select('user_id')
      .eq('id', item.wishlist_id)
      .single();

    if (wishlistError || !wishlist) {
      alert('Wishlist not found');
      setLoading(false);
      return;
    }

    if (wishlist.user_id !== user.id) {
      alert('You do not have permission to delete items from this wishlist');
      setLoading(false);
      return;
    }

    // Delete image from storage if it exists
    if (item.image_url) {
      const fileName = item.image_url.split('/').slice(-3).join('/');
      await supabase.storage.from('wishlist-images').remove([fileName]);
    }

    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('id', item.id);

    if (error) {
      alert('Failed to delete item: ' + error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    onUpdate();
  };

  return (
    <Card className={item.is_purchased && !shouldHidePurchaseStatus ? 'opacity-60' : ''}>
      <div className="flex flex-col">
        {/* Top section - Info and Image side by side */}
        <div className="flex flex-col md:flex-row">
          {/* Left side - Information */}
          <div className="flex-1">
            <CardHeader>
              <CardTitle className="text-lg">{item.name}</CardTitle>
              {item.price && item.price > 0 && (
                <CardDescription className="font-semibold text-green-600">
                  ${item.price.toFixed(2)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {item.description && (
                <p className="text-sm text-gray-600">{item.description}</p>
              )}

              {item.url && (
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:underline"
                >
                  <ExternalLink className="mr-1 h-3 w-3" />
                  View Product
                </a>
              )}
            </CardContent>
          </div>

          {/* Right side - Image */}
          {item.image_url && (
            <div className="relative w-full md:w-64 h-48 md:h-64 flex-shrink-0 rounded-r-lg overflow-hidden bg-gray-100">
              <Image
                src={item.image_url}
                alt={item.name}
                fill
                className="object-contain"
              />
              {item.is_purchased && !shouldHidePurchaseStatus && (
                <div className="absolute inset-0 bg-green-600 bg-opacity-20 flex items-center justify-center">
                  <div className="bg-green-600 text-white rounded-full p-3">
                    <Check className="h-8 w-8" />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom section - Buttons */}
        <CardContent className="pt-0">
          <div className="flex gap-2 pt-2">
            {!isOwner && (
              <Button
                onClick={handleTogglePurchased}
                disabled={loading}
                variant={item.is_purchased ? 'outline' : 'default'}
                size="sm"
                className="flex-1"
              >
                <Check className="mr-1 h-4 w-4" />
                {item.is_purchased ? 'Unmark' : 'Mark Purchased'}
              </Button>
            )}
            {isOwner && (
              <>
                <Link href={`/dashboard/wishlists/${item.wishlist_id}/edit-item/${item.id}`}>
                  <Button
                    disabled={loading}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  onClick={handleDelete}
                  disabled={loading}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          {item.is_purchased && !shouldHidePurchaseStatus && (
            <div className="text-sm text-green-600 font-semibold pt-1">
              Purchased
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}
