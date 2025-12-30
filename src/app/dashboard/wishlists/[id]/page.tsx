'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useWishlists, useWishlistItems } from '@/hooks/useWishlists';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { WishlistItemCard } from '@/components/wishlist/WishlistItemCard';
import { ShareWishlistDialog } from '@/components/wishlist/ShareWishlistDialog';
import { WishlistSettings } from '@/components/wishlist/WishlistSettings';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from '@/components/wishlist/SortableItem';

export default function WishlistDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wishlistId = params.id as string;
  const { wishlists, sharedWishlists, loading: wishlistsLoading, refetch: refetchWishlists } = useWishlists();
  const { items, loading: itemsLoading, refetch: refetchItems } = useWishlistItems(wishlistId);
  const [deleting, setDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const supabase = createClient();

  // Check both owned and shared wishlists
  const wishlist = wishlists.find((w) => w.id === wishlistId) || sharedWishlists.find((w) => w.id === wishlistId);
  const isOwner = currentUserId === wishlist?.user_id;

  // Handler to refetch both wishlists and items
  const handleUpdate = () => {
    refetchWishlists();
    refetchItems();
  };

  // Don't filter items - always show all items
  // The "hide purchased" setting only hides the visual indicators, not the items themselves
  const displayItems = items;

  // Sensors for drag and drop (desktop, touch, and keyboard)
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      // Require a 5px movement before activating drag (prevents conflicts with scrolling)
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    const reorderedItems = arrayMove(items, oldIndex, newIndex);

    // Update sort_order in database
    const updates = reorderedItems.map((item, index) => ({
      id: item.id,
      sort_order: index,
    }));

    for (const update of updates) {
      await supabase
        .from('wishlist_items')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
    }

    refetchItems();
  };

  const handleDeleteWishlist = async () => {
    if (!confirm('Are you sure you want to delete this wishlist? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);

    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) {
      alert('Failed to delete wishlist: ' + error.message);
      setDeleting(false);
      return;
    }

    router.push('/dashboard/wishlists');
    router.refresh();
  };

  if (wishlistsLoading || itemsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading wishlist...</p>
      </div>
    );
  }

  if (!wishlist) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500 mb-4">Wishlist not found</p>
        <Link href="/dashboard/wishlists">
          <Button>Back to Wishlists</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/wishlists">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wishlists
          </Button>
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{wishlist.name}</h1>
            <p className="text-gray-600">
              Created {new Date(wishlist.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <>
                <ShareWishlistDialog
                  wishlistId={wishlistId}
                  wishlistName={wishlist.name}
                  shareToken={wishlist.share_token}
                  onUpdate={handleUpdate}
                />
                <WishlistSettings wishlist={wishlist} onUpdate={handleUpdate} />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteWishlist}
                  disabled={deleting}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Items ({displayItems.length})</h2>
        {isOwner && (
          <Link href={`/dashboard/wishlists/${wishlistId}/add-item`}>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </Link>
        )}
      </div>

      {displayItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">No items yet</h3>
            <p className="text-gray-600 mb-4 text-center">
              {isOwner ? 'Add items to your wishlist to start tracking your Christmas wishes' : 'This wishlist has no items yet'}
            </p>
            {isOwner && (
              <Link href={`/dashboard/wishlists/${wishlistId}/add-item`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add First Item
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : isOwner ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Drag items to reorder them by priority (most wanted at the top)
          </p>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={displayItems.map((item) => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4 md:grid-cols-2">
                {displayItems.map((item, index) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    isOwner={isOwner}
                    hidePurchased={wishlist.hide_purchased ?? false}
                    onUpdate={refetchItems}
                    rank={index + 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {displayItems.map((item) => (
            <WishlistItemCard
              key={item.id}
              item={item}
              isOwner={isOwner}
              hidePurchased={false}
              onUpdate={refetchItems}
            />
          ))}
        </div>
      )}
    </div>
  );
}
