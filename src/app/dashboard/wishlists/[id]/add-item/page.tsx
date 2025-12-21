'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { wishlistItemSchema, type WishlistItemFormData } from '@/lib/validations/wishlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Upload, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function AddItemPage() {
  const params = useParams();
  const router = useRouter();
  const wishlistId = params.id as string;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<WishlistItemFormData>({
    resolver: zodResolver(wishlistItemSchema),
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (5MB max)
      if (file.size > 5242880) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      const validTypes = [
        'image/jpeg', 'image/jpg', 'image/png', 'image/gif',
        'image/webp', 'image/heic', 'image/heif', 'image/bmp',
        'image/tiff', 'image/svg+xml', 'image/avif'
      ];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a valid image file (JPEG, PNG, GIF, WebP, HEIC, HEIF, BMP, TIFF, SVG, AVIF)');
        return;
      }

      setImageFile(file);
      setValue('image', file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setError(null);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setValue('image', undefined);
  };

  const onSubmit = async (data: WishlistItemFormData) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to add items');
      setLoading(false);
      return;
    }

    let imageUrl = null;

    // Upload image if provided
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${wishlistId}/${Date.now()}.${fileExt}`;

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('wishlist-images')
        .upload(fileName, imageFile);

      if (uploadError) {
        setError('Failed to upload image: ' + uploadError.message);
        setLoading(false);
        return;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('wishlist-images')
        .getPublicUrl(fileName);

      imageUrl = publicUrl;
    }

    // Get current max sort_order
    const { data: existingItems } = await supabase
      .from('wishlist_items')
      .select('sort_order')
      .eq('wishlist_id', wishlistId)
      .order('sort_order', { ascending: false })
      .limit(1);

    const nextSortOrder = existingItems && existingItems.length > 0
      ? existingItems[0].sort_order + 1
      : 0;

    // Insert item
    const { error: insertError } = await supabase
      .from('wishlist_items')
      .insert({
        wishlist_id: wishlistId,
        name: data.name,
        description: data.description || null,
        url: data.url || null,
        price: data.price || null,
        image_url: imageUrl,
        is_purchased: false,
        sort_order: nextSortOrder,
      });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/wishlists/${wishlistId}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href={`/dashboard/wishlists/${wishlistId}`}>
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wishlist
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Add Item</h1>
        <p className="text-gray-600">Add a new item to your wishlist</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Item Details</CardTitle>
          <CardDescription>Fill in the details for your wishlist item</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Nintendo Switch"
                {...register('name')}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="Add any notes or details about this item"
                {...register('description')}
                disabled={loading}
                rows={3}
              />
              {errors.description && (
                <p className="text-sm text-red-500">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Product URL (optional)</Label>
              <Input
                id="url"
                type="text"
                placeholder="https://example.com/product"
                {...register('url')}
                disabled={loading}
              />
              {errors.url && (
                <p className="text-sm text-red-500">{errors.url.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (optional)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                {...register('price', { valueAsNumber: true })}
                disabled={loading}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (optional)</Label>
              {imagePreview ? (
                <div className="relative w-full h-64 rounded-md overflow-hidden border">
                  <Image
                    src={imagePreview}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed rounded-md p-6 text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                  <Label
                    htmlFor="image"
                    className="cursor-pointer text-sm text-blue-600 hover:underline"
                  >
                    Click to upload image
                  </Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,image/heif,image/bmp,image/tiff,image/svg+xml,image/avif"
                    onChange={handleImageChange}
                    disabled={loading}
                    className="hidden"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, PNG, GIF, WebP, HEIC, HEIF, BMP, TIFF, SVG, AVIF (max 5MB)
                  </p>
                </div>
              )}
              {errors.image && (
                <p className="text-sm text-red-500">{errors.image.message}</p>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Adding...' : 'Add Item'}
              </Button>
              <Link href={`/dashboard/wishlists/${wishlistId}`}>
                <Button type="button" variant="outline" disabled={loading}>
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
