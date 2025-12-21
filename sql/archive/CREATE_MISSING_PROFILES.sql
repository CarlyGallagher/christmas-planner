-- ============================================
-- Create Missing Profiles for Existing Users
-- ============================================

-- Check if there are users without profiles
SELECT
  au.id,
  au.email,
  au.created_at,
  CASE WHEN p.id IS NULL THEN 'MISSING PROFILE' ELSE 'Has Profile' END as profile_status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;

-- Create profiles for any users that don't have one
INSERT INTO public.profiles (id, display_name)
SELECT
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', SPLIT_PART(au.email, '@', 1)) as display_name
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Verify all users now have profiles
SELECT
  au.id,
  au.email,
  p.display_name,
  'Profile created!' as status
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC;
