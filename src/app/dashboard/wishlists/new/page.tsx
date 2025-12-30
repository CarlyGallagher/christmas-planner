'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createClient } from '@/lib/supabase/client';
import { createWishlistSchema, type CreateWishlistFormData } from '@/lib/validations/wishlist';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Globe, Lock } from 'lucide-react';
import Link from 'next/link';

export default function NewWishlistPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateWishlistFormData>({
    resolver: zodResolver(createWishlistSchema),
  });

  const onSubmit = async (data: CreateWishlistFormData) => {
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError('You must be logged in to create a wishlist');
      setLoading(false);
      return;
    }

    // Check if profile exists first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      setError(`Profile not found. Please contact support. User ID: ${user.id}`);
      console.error('Profile check failed:', profileError);
      setLoading(false);
      return;
    }

    const { data: wishlist, error: createError } = await supabase
      .from('wishlists')
      .insert({
        name: data.name,
        user_id: user.id,
        is_shared: false,
        is_public: isPublic,
      })
      .select()
      .single();

    if (createError) {
      setError(`${createError.message} (User ID: ${user.id})`);
      console.error('Create wishlist error:', createError);
      setLoading(false);
      return;
    }

    router.push(`/dashboard/wishlists/${wishlist.id}`);
    router.refresh();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link href="/dashboard/wishlists">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Wishlists
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Create New Wishlist</h1>
        <p className="text-gray-600">Start a new wishlist for Christmas</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Wishlist Details</CardTitle>
          <CardDescription>Give your wishlist a name</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Wishlist Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Christmas 2025 Wishlist"
                {...register('name')}
                disabled={loading}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-3">
              <Label className="text-base font-semibold">Visibility</Label>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  disabled={loading}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                    !isPublic
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Lock className={`h-5 w-5 mt-0.5 ${!isPublic ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-semibold">Private</div>
                    <div className="text-sm text-gray-600">
                      Only you and people you explicitly share with can see this wishlist
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  disabled={loading}
                  className={`flex items-start gap-3 p-4 border-2 rounded-lg text-left transition-colors ${
                    isPublic
                      ? 'border-green-600 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Globe className={`h-5 w-5 mt-0.5 ${isPublic ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-semibold">Public</div>
                    <div className="text-sm text-gray-600">
                      Anyone with the link can view this wishlist
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating...' : 'Create Wishlist'}
              </Button>
              <Link href="/dashboard/wishlists">
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
