import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const limit = parseInt(searchParams.get('limit') || '10');

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  const supabase = await createClient();

  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Search for users by display name (case-insensitive)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, created_at')
      .ilike('display_name', `%${query}%`)
      .neq('id', user.id) // Exclude the current user
      .limit(limit);

    if (error) {
      console.error('User search error:', error);
      return NextResponse.json({ error: 'Failed to search users' }, { status: 500 });
    }

    return NextResponse.json({ users: profiles || [] });
  } catch (error) {
    console.error('Unexpected error during user search:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
