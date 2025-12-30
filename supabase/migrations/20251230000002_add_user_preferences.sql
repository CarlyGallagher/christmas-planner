-- Add preferences column to profiles table
-- This will store user preferences like calendar view choice as JSONB

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}'::jsonb;

-- Create an index on the preferences column for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON public.profiles USING GIN (preferences);

-- Add a comment to document the preferences structure
COMMENT ON COLUMN public.profiles.preferences IS
'User preferences stored as JSONB. Example: {"calendarView": "year", "theme": "light"}';
