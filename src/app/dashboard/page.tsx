import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Calendar, Users } from 'lucide-react';
import { WeekView } from '@/components/dashboard/WeekView';

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

  // Get wishlists count
  const { count: wishlistsCount } = await supabase
    .from('wishlists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id);

  // Get upcoming events count (events that haven't ended yet)
  const today = new Date().toISOString();
  const { count: eventsCount } = await supabase
    .from('calendar_events')
    .select('*', { count: 'exact', head: true })
    .gte('end_date', today);

  // Get friends count (accepted friends where user is either user_id or friend_id)
  const { data: friendsData } = await supabase
    .from('friends')
    .select('id')
    .eq('status', 'accepted')
    .or(`user_id.eq.${user?.id},friend_id.eq.${user?.id}`);

  const friendsCount = friendsData?.length || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back {profile?.display_name}!</h1>
        <p className="text-gray-600">Here&apos;s your planning dashboard</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Wishlists</CardTitle>
            <CardDescription>Manage your wish lists</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{wishlistsCount || 0}</p>
            <p className="text-sm text-gray-600">Total wishlists</p>
            <Link href="/dashboard/wishlists">
              <Button size="sm" className="w-full">
                <Plus className="mr-1 h-4 w-4" />
                New Wishlist
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Upcoming events</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{eventsCount || 0}</p>
            <p className="text-sm text-gray-600">Upcoming events</p>
            <Link href="/dashboard/calendar">
              <Button size="sm" className="w-full">
                <Calendar className="mr-1 h-4 w-4" />
                View Calendar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Friends</CardTitle>
            <CardDescription>Your connections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-2xl font-bold">{friendsCount}</p>
            <p className="text-sm text-gray-600">Total friends</p>
            <Link href="/dashboard/friends">
              <Button size="sm" className="w-full">
                <Users className="mr-1 h-4 w-4" />
                Manage Friends
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      <WeekView />
    </div>
  );
}
