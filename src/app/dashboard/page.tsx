import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  // Get wishlists count (owned + shared)
  const { data: ownedWishlists } = await supabase
    .from('wishlists')
    .select('id')
    .eq('user_id', user?.id);

  const { data: sharedWishlists } = await supabase
    .from('wishlist_shares')
    .select('id')
    .eq('shared_with_user_id', user?.id);

  const totalWishlists = (ownedWishlists?.length || 0) + (sharedWishlists?.length || 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {profile?.display_name}!</h1>
        <p className="text-gray-600">Here&apos;s your Christmas planning dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/dashboard/wishlists">
          <Card className="cursor-pointer hover:bg-gray-50 transition-colors">
            <CardHeader>
              <CardTitle>Wishlists</CardTitle>
              <CardDescription>Manage your wish lists</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{totalWishlists}</p>
              <p className="text-sm text-gray-600">Total wishlists</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Upcoming Christmas events</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-600">Upcoming events</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Reminders</CardTitle>
            <CardDescription>Active notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">0</p>
            <p className="text-sm text-gray-600">Pending reminders</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with your planning</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-gray-600">
            🎁 Create your first wishlist<br />
            📅 Add a Christmas event to your calendar<br />
            👨‍👩‍👧‍👦 Share your plans with family
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
