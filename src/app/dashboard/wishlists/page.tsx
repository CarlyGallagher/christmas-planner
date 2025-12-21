'use client';

import { useWishlists } from '@/hooks/useWishlists';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Plus, Gift, Users } from 'lucide-react';

export default function WishlistsPage() {
  const { wishlists, loading } = useWishlists();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading wishlists...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Wishlists</h1>
          <p className="text-gray-600">Manage your Christmas wishlists</p>
        </div>
        <Link href="/dashboard/wishlists/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Wishlist
          </Button>
        </Link>
      </div>

      {wishlists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Gift className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No wishlists yet</h3>
            <p className="text-gray-600 mb-4 text-center">
              Create your first wishlist to start tracking your Christmas wishes
            </p>
            <Link href="/dashboard/wishlists/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Wishlist
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {wishlists.map((wishlist) => (
            <Link key={wishlist.id} href={`/dashboard/wishlists/${wishlist.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{wishlist.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Created {new Date(wishlist.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {wishlist.is_shared && (
                      <Users className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600">
                    Click to view items
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
