import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Get pending friend requests count
  const { count: pendingRequestsCount } = await supabase
    .from('friends')
    .select('*', { count: 'exact', head: true })
    .eq('friend_id', user.id)
    .eq('status', 'pending');

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header/Navigation */}
      <header className="border-b bg-white">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="text-xl font-bold text-green-600">
              🎄 Christmas Planner
            </Link>
            <nav className="hidden md:flex gap-4">
              <Link href="/dashboard" className="text-sm font-medium hover:text-green-600">
                Dashboard
              </Link>
              <Link href="/dashboard/wishlists" className="text-sm font-medium hover:text-green-600">
                Wishlists
              </Link>
              <Link href="/dashboard/calendar" className="text-sm font-medium hover:text-green-600">
                Calendar
              </Link>
              <Link href="/dashboard/friends" className="text-sm font-medium hover:text-green-600 flex items-center gap-1">
                Friends
                {pendingRequestsCount !== null && pendingRequestsCount > 0 && (
                  <span className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                    {pendingRequestsCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>
          <form action={handleSignOut}>
            <Button variant="outline" size="sm" type="submit">
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
