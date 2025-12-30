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
import { Settings, Globe, Lock } from 'lucide-react';
import type { Wishlist } from '@/types';

interface WishlistSettingsProps {
  wishlist: Wishlist;
  onUpdate: () => void;
}

export function WishlistSettings({ wishlist, onUpdate }: WishlistSettingsProps) {
  const [open, setOpen] = useState(false);
  const [hidePurchased, setHidePurchased] = useState(wishlist.hide_purchased ?? false);
  const [isPublic, setIsPublic] = useState(wishlist.is_public ?? false);
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

  const handleToggleVisibility = async (makePublic: boolean) => {
    setIsPublic(makePublic);
    setLoading(true);

    const { error } = await supabase
      .from('wishlists')
      .update({ is_public: makePublic })
      .eq('id', wishlist.id);

    if (error) {
      alert('Failed to update visibility: ' + error.message);
      setIsPublic(!makePublic);
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
          {/* Visibility Setting */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Wishlist Visibility</Label>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={() => handleToggleVisibility(false)}
                disabled={loading}
                className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${
                  !isPublic
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Lock className={`h-5 w-5 mt-0.5 ${!isPublic ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Private</div>
                  <div className="text-xs text-gray-600">
                    Only you and people you share with can see this
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleToggleVisibility(true)}
                disabled={loading}
                className={`flex items-start gap-3 p-3 border-2 rounded-lg text-left transition-colors ${
                  isPublic
                    ? 'border-green-600 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Globe className={`h-5 w-5 mt-0.5 ${isPublic ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <div className="font-semibold text-sm">Public</div>
                  <div className="text-xs text-gray-600">
                    Anyone with the link can view this wishlist
                  </div>
                </div>
              </button>
            </div>
          </div>

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
                Hide purchase indicators from me (keep it a surprise!)
              </Label>
            </div>
            <p className="text-xs text-gray-500">
              When enabled, you'll still see all items but won't see checkmarks or indicators showing which items have been purchased by others.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
