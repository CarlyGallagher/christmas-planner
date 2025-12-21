-- ============================================
-- Force Create Profile - Manual Approach
-- ============================================

-- First, let's see what users exist
SELECT id, email, created_at FROM auth.users;

-- Check what profiles exist
SELECT id, display_name FROM public.profiles;

-- Now create profiles for ALL users (this will skip duplicates)
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN (SELECT id, email, raw_user_meta_data FROM auth.users)
  LOOP
    -- Try to insert, ignore if it already exists
    INSERT INTO public.profiles (id, display_name)
    VALUES (
      user_record.id,
      COALESCE(user_record.raw_user_meta_data->>'display_name', SPLIT_PART(user_record.email, '@', 1))
    )
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END $$;

-- Verify - this should show a profile for every user
SELECT
  au.id as user_id,
  au.email,
  p.display_name,
  p.created_at as profile_created
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
