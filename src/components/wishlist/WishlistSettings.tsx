'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Settings } from 'lucide-react';
import type { Wishlist } from '@/types';

interface WishlistSettingsProps {
  wishlist: Wishlist;
  onUpdate: () => void;
}

export function WishlistSettings({ wishlist, onUpdate }: WishlistSettingsProps) {
  const [open, setOpen] = useState(false);
  const [hidePurchased, setHidePurchased] = useState(wishlist.hide_purchased ?? false);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleToggleHidePurchased = async (checked: boolean) => {
    setHidePurchased(checked);
    setLoading(true);

    const { error } = await supabase
      .from('wishlists')
      .update({ hide_purchased: checked })
      .eq('id', wishlist.id);

    if (error) {
      alert('Failed to update setting: ' + error.message);
      setHidePurchased(!checked);
    } else {
      onUpdate();
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Wishlist Settings</DialogTitle>
          <DialogDescription>
            Manage settings for "{wishlist.name}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Hide Purchased Toggle */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Purchase Visibility</Label>
            <div className="flex items-center space-x-2">
              <input
                id="hidePurchased"
                type="checkbox"
                checked={hidePurchased}
                onChange={(e) => handleToggleHidePurchased(e.target.checked)}
                disabled={loading}
                className="h-4 w-4 rounded border-gray-300"
              />
              <Label htmlFor="hidePurchased" className="font-normal">
                Hide purchased items from me (keep it a surprise!)
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, you won't see which items have been marked as purchased by others.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
