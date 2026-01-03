import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Check if profile already exists
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .single();

  if (existingProfile) {
    return NextResponse.json({ message: 'Profile already exists', profile: existingProfile });
  }

  // Create profile
  const displayName = user.user_metadata?.display_name || user.email?.split('@')[0] || 'User';

  const { data: newProfile, error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      display_name: displayName,
    })
    .select()
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ message: 'Profile created', profile: newProfile });
}
