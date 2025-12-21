'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { shareWishlistSchema, type ShareWishlistFormData } from '@/lib/validations/wishlist';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Share2, Copy, Check } from 'lucide-react';

interface ShareWishlistDialogProps {
  wishlistId: string;
  wishlistName: string;
  shareToken?: string | null;
  onUpdate?: () => void;
}

export function ShareWishlistDialog({ wishlistId, wishlistName, shareToken, onUpdate }: ShareWishlistDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [shares, setShares] = useState<Array<{ email: string; canMarkPurchased: boolean }>>([]);
  const supabase = createClient();

  const shareUrl = shareToken && typeof window !== 'undefined'
    ? `${window.location.origin}/shared/${shareToken}`
    : null;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ShareWishlistFormData>({
    resolver: zodResolver(shareWishlistSchema),
    defaultValues: {
      canMarkPurchased: true,
    },
  });

  const loadShares = async () => {
    const { data, error } = await supabase
      .from('wishlist_shares')
      .select(`
        id,
        can_mark_purchased,
        profiles!shared_with_user_id (
          display_name
        )
      `)
      .eq('wishlist_id', wishlistId);

    if (!error && data) {
      const sharesList = data.map((share: any) => ({
        email: share.profiles?.display_name || 'Unknown User',
        canMarkPurchased: share.can_mark_purchased,
      }));
      setShares(sharesList);
    }
  };

  const onSubmit = async (data: ShareWishlistFormData) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // For now, we need to create an API route to look up users by email
    // This is a simplified version - user must enter the display name instead
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name')
      .ilike('display_name', data.email);

    if (userError || !userData || userData.length === 0) {
      setError('No user found with this display name. Ask them to share their username from their profile.');
      setLoading(false);
      return;
    }

    const sharedWithUserId = userData[0].id;

    // Check if already shared
    const { data: existingShares } = await supabase
      .from('wishlist_shares')
      .select('id')
      .eq('wishlist_id', wishlistId)
      .eq('shared_with_user_id', sharedWithUserId);

    if (existingShares && existingShares.length > 0) {
      setError('This wishlist is already shared with this user');
      setLoading(false);
      return;
    }

    // Create share
    const { error: shareError } = await supabase
      .from('wishlist_shares')
      .insert({
        wishlist_id: wishlistId,
        shared_with_user_id: sharedWithUserId,
        can_mark_purchased: data.canMarkPurchased,
      });

    if (shareError) {
      setError(shareError.message);
      setLoading(false);
      return;
    }

    // Update wishlist to mark as shared
    await supabase
      .from('wishlists')
      .update({ is_shared: true })
      .eq('id', wishlistId);

    setSuccess(`Wishlist shared with ${data.email}`);
    reset();
    loadShares();
    setLoading(false);
  };

  const handleGenerateShareLink = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    // Generate UUID client-side
    const newToken = self.crypto.randomUUID();

    const { error: updateError } = await supabase
      .from('wishlists')
      .update({ share_token: newToken })
      .eq('id', wishlistId);

    if (updateError) {
      setError('Failed to generate share link: ' + updateError.message);
    } else {
      setSuccess('Share link generated!');
      if (onUpdate) onUpdate();
    }

    setLoading(false);
  };

  const handleCopyLink = () => {
    if (shareUrl) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadShares}>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Wishlist</DialogTitle>
          <DialogDescription>
            Share "{wishlistName}" with family and friends
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Shareable Link Section */}
          <div className="space-y-2">
            <Label className="text-base font-semibold">Shareable Link</Label>
            <p className="text-sm text-gray-600">
              Generate a link to share via text, email, or social media
            </p>

            {shareUrl ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="text-sm"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    type="button"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-600" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Anyone with this link can view your wishlist
                </p>
              </div>
            ) : (
              <Button
                onClick={handleGenerateShareLink}
                disabled={loading}
                className="w-full"
                type="button"
              >
                {loading ? 'Generating...' : 'Generate Share Link'}
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-muted-foreground">Or share with specific users</span>
            </div>
          </div>

          {/* Share with User Section */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">User's Display Name</Label>
            <Input
              id="email"
              type="text"
              placeholder="Enter their username"
              {...register('email')}
              disabled={loading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="canMarkPurchased"
              type="checkbox"
              {...register('canMarkPurchased')}
              disabled={loading}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="canMarkPurchased" className="font-normal">
              Allow them to mark items as purchased
            </Label>
          </div>

          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              {success}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Sharing...' : 'Share Wishlist'}
          </Button>
        </form>

        {shares.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-semibold mb-2">Shared with:</h4>
            <div className="space-y-2">
              {shares.map((share, index) => (
                <div key={index} className="text-sm text-gray-600 flex justify-between items-center">
                  <span>{share.email}</span>
                  <span className="text-xs">
                    {share.canMarkPurchased ? 'Can mark purchased' : 'View only'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
