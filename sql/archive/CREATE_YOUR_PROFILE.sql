-- ============================================
-- Create Profile for User ID: 224d741e-f2da-43a9-96e5-f511b062d380
-- ============================================

-- First, let's check if the user exists in auth.users
SELECT id, email FROM auth.users WHERE id = '224d741e-f2da-43a9-96e5-f511b062d380';

-- Now create the profile
INSERT INTO public.profiles (id, display_name)
VALUES (
  '224d741e-f2da-43a9-96e5-f511b062d380',
  (SELECT COALESCE(raw_user_meta_data->>'display_name', SPLIT_PART(email, '@', 1))
   FROM auth.users
   WHERE id = '224d741e-f2da-43a9-96e5-f511b062d380')
)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name;

-- Verify the profile was created
SELECT id, display_name, created_at FROM public.profiles WHERE id = '224d741e-f2da-43a9-96e5-f511b062d380';
