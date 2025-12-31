'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Friend, FriendWithProfile } from '@/types';

export function useFriends() {
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchFriends = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    // Get accepted friends (where user is either user_id or friend_id)
    const { data: acceptedFriends, error: friendsError } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(
          id,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('status', 'accepted')
      .eq('user_id', user.id);

    // Also get friendships where current user is the friend_id
    const { data: reverseFriends, error: reverseFriendsError } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_user_id_fkey(
          id,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('status', 'accepted')
      .eq('friend_id', user.id);

    // Get pending requests received (where user is friend_id)
    const { data: pending, error: pendingError } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_user_id_fkey(
          id,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('status', 'pending')
      .eq('friend_id', user.id);

    // Get pending requests sent (where user is user_id)
    const { data: sent, error: sentError } = await supabase
      .from('friends')
      .select(`
        *,
        friend_profile:profiles!friends_friend_id_fkey(
          id,
          display_name,
          avatar_url,
          created_at
        )
      `)
      .eq('status', 'pending')
      .eq('user_id', user.id);

    if (!friendsError && acceptedFriends) {
      const combined = [...acceptedFriends];
      if (!reverseFriendsError && reverseFriends) {
        // For reverse friends, swap the user_id and friend_id for consistency
        const normalizedReverse = reverseFriends.map(f => ({
          ...f,
          friend_profile: f.friend_profile,
        }));
        combined.push(...normalizedReverse);
      }
      setFriends(combined as FriendWithProfile[]);
    }

    if (!pendingError && pending) {
      setPendingRequests(pending as FriendWithProfile[]);
    }

    if (!sentError && sent) {
      setSentRequests(sent as FriendWithProfile[]);
    }

    setLoading(false);
  };

  const sendFriendRequest = async (friendId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Not authenticated' };

    // Check if a friendship already exists in either direction
    const { data: existing } = await supabase
      .from('friends')
      .select('*')
      .or(`and(user_id.eq.${user.id},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${user.id})`);

    if (existing && existing.length > 0) {
      return { error: 'Friend request already exists' };
    }

    const { error } = await supabase
      .from('friends')
      .insert({
        user_id: user.id,
        friend_id: friendId,
        status: 'pending',
      });

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { success: true };
  };

  const acceptFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('id', requestId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { success: true };
  };

  const declineFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { success: true };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', friendshipId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { success: true };
  };

  const cancelFriendRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('friends')
      .delete()
      .eq('id', requestId);

    if (error) {
      return { error: error.message };
    }

    await fetchFriends();
    return { success: true };
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    cancelFriendRequest,
    refetch: fetchFriends,
  };
}
