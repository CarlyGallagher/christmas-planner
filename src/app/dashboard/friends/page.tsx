'use client';

import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Users, UserPlus, UserCheck, UserX, Search } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function FriendsPage() {
  const router = useRouter();
  const {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest,
  } = useFriends();

  const handleAcceptRequest = async (requestId: string) => {
    await acceptFriendRequest(requestId);
    router.refresh(); // Refresh server components to update badge count
  };

  const handleDeclineRequest = async (requestId: string) => {
    await declineFriendRequest(requestId);
    router.refresh(); // Refresh server components to update badge count
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Loading friends...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Friends</h1>
          <p className="text-gray-600">Manage your friend connections</p>
        </div>
        <Link href="/dashboard/friends/browse">
          <Button>
            <Search className="mr-2 h-4 w-4" />
            Find Friends
          </Button>
        </Link>
      </div>

      {/* Pending Requests Section */}
      {pendingRequests.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              Friend Requests
            </h2>
            <p className="text-gray-600">People who want to connect with you</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pendingRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {request.friend_profile?.avatar_url ? (
                      <Image
                        src={request.friend_profile.avatar_url}
                        alt={request.friend_profile.display_name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {request.friend_profile?.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    onClick={() => handleAcceptRequest(request.id)}
                    size="sm"
                    className="flex-1"
                  >
                    <UserCheck className="mr-1 h-4 w-4" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleDeclineRequest(request.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <UserX className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Sent Requests Section */}
      {sentRequests.length > 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <UserPlus className="h-6 w-6 text-gray-500" />
              Pending Sent Requests
            </h2>
            <p className="text-gray-600">Waiting for response</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sentRequests.map((request) => (
              <Card key={request.id} className="border-dashed">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {request.friend_profile?.avatar_url ? (
                      <Image
                        src={request.friend_profile.avatar_url}
                        alt={request.friend_profile.display_name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {request.friend_profile?.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Sent {new Date(request.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={() => cancelFriendRequest(request.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Cancel Request
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Friends List Section */}
      <div className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            My Friends
          </h2>
          <p className="text-gray-600">
            {friends.length === 0
              ? 'No friends yet. Find people to connect with!'
              : `${friends.length} friend${friends.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {friends.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No friends yet</h3>
              <p className="text-gray-600 mb-4 text-center">
                Start connecting with people to share wishlists and plans
              </p>
              <Link href="/dashboard/friends/browse">
                <Button>
                  <Search className="mr-2 h-4 w-4" />
                  Find Friends
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friend) => (
              <Card key={friend.id}>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {friend.friend_profile?.avatar_url ? (
                      <Image
                        src={friend.friend_profile.avatar_url}
                        alt={friend.friend_profile.display_name}
                        width={40}
                        height={40}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <Users className="h-5 w-5 text-gray-500" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">
                        {friend.friend_profile?.display_name}
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Friends since {new Date(friend.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex gap-2">
                  <Button
                    onClick={() => removeFriend(friend.id)}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <UserX className="mr-1 h-4 w-4" />
                    Remove Friend
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
