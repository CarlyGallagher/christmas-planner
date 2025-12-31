'use client';

import { useState } from 'react';
import { useFriends } from '@/hooks/useFriends';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Users, UserPlus, UserCheck, Clock } from 'lucide-react';
import Image from 'next/image';
import type { Profile } from '@/types';

export default function BrowseFriendsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { friends, sentRequests, sendFriendRequest } = useFriends();

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setHasSearched(true);

    try {
      const response = await fetch(`/api/users/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();

      if (response.ok) {
        setSearchResults(data.users || []);
      } else {
        console.error('Search failed:', data.error);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const isFriend = (userId: string) => {
    return friends.some(
      (f) =>
        (f.friend_id === userId && f.status === 'accepted') ||
        (f.user_id === userId && f.status === 'accepted')
    );
  };

  const hasPendingRequest = (userId: string) => {
    return sentRequests.some((r) => r.friend_id === userId);
  };

  const handleSendRequest = async (userId: string) => {
    const result = await sendFriendRequest(userId);
    if (result.error) {
      alert(result.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Find Friends</h1>
        <p className="text-gray-600">Search for people to connect with</p>
      </div>

      {/* Search Box */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
          <CardDescription>Search by display name</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter a name to search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Search Results */}
      {hasSearched && (
        <div className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Search Results</h2>
            <p className="text-gray-600">
              {searchResults.length === 0
                ? 'No users found'
                : `Found ${searchResults.length} user${searchResults.length !== 1 ? 's' : ''}`}
            </p>
          </div>

          {searchResults.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold mb-2">No users found</h3>
                <p className="text-gray-600 text-center">
                  Try searching with a different name
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {searchResults.map((user) => {
                const isAlreadyFriend = isFriend(user.id);
                const isPending = hasPendingRequest(user.id);

                return (
                  <Card key={user.id}>
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        {user.avatar_url ? (
                          <Image
                            src={user.avatar_url}
                            alt={user.display_name}
                            width={48}
                            height={48}
                            className="rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                            <Users className="h-6 w-6 text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg truncate">
                            {user.display_name}
                          </CardTitle>
                          <CardDescription className="text-xs">
                            Joined {new Date(user.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {isAlreadyFriend ? (
                        <Button disabled variant="outline" size="sm" className="w-full">
                          <UserCheck className="mr-1 h-4 w-4" />
                          Already Friends
                        </Button>
                      ) : isPending ? (
                        <Button disabled variant="outline" size="sm" className="w-full">
                          <Clock className="mr-1 h-4 w-4" />
                          Request Pending
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSendRequest(user.id)}
                          size="sm"
                          className="w-full"
                        >
                          <UserPlus className="mr-1 h-4 w-4" />
                          Add Friend
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
