-- Add color field to calendar_events table for color coding

ALTER TABLE public.calendar_events
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3b82f6'; -- Default blue color

-- Add comment for clarity
COMMENT ON COLUMN public.calendar_events.color IS 'Hex color code for the event (e.g., #3b82f6)';
