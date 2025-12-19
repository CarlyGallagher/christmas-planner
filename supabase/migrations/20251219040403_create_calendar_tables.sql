-- Create calendars table
CREATE TABLE IF NOT EXISTS public.calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  is_shared BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create calendar_events table
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurrence_rule TEXT, -- RRULE format (RFC 5545)
  reminder_minutes INTEGER, -- Minutes before event to send reminder
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- Create calendar_shares table (for sharing calendars with others)
CREATE TABLE IF NOT EXISTS public.calendar_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID NOT NULL REFERENCES public.calendars(id) ON DELETE CASCADE,
  shared_with_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(calendar_id, shared_with_user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_calendars_owner_id ON public.calendars(owner_id);
CREATE INDEX idx_calendar_events_calendar_id ON public.calendar_events(calendar_id);
CREATE INDEX idx_calendar_events_start_date ON public.calendar_events(start_date);
CREATE INDEX idx_calendar_events_created_by ON public.calendar_events(created_by);
CREATE INDEX idx_calendar_shares_calendar_id ON public.calendar_shares(calendar_id);
CREATE INDEX idx_calendar_shares_user_id ON public.calendar_shares(shared_with_user_id);

-- Enable Row Level Security
ALTER TABLE public.calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendars
-- Users can view their own calendars and calendars shared with them
CREATE POLICY "Users can view their own calendars"
  ON public.calendars
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR id IN (
      SELECT calendar_id FROM public.calendar_shares
      WHERE shared_with_user_id = auth.uid()
    )
  );

-- Users can insert their own calendars
CREATE POLICY "Users can insert their own calendars"
  ON public.calendars
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own calendars
CREATE POLICY "Users can update their own calendars"
  ON public.calendars
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own calendars
CREATE POLICY "Users can delete their own calendars"
  ON public.calendars
  FOR DELETE
  USING (auth.uid() = owner_id);

-- RLS Policies for calendar_events
-- Users can view events from their calendars or shared calendars
CREATE POLICY "Users can view events from accessible calendars"
  ON public.calendar_events
  FOR SELECT
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars
      WHERE owner_id = auth.uid()
      OR id IN (
        SELECT calendar_id FROM public.calendar_shares
        WHERE shared_with_user_id = auth.uid()
      )
    )
  );

-- Users can insert events into their own calendars or calendars where they have edit permission
CREATE POLICY "Users can insert events into their calendars"
  ON public.calendar_events
  FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND (
      calendar_id IN (
        SELECT id FROM public.calendars WHERE owner_id = auth.uid()
      )
      OR calendar_id IN (
        SELECT calendar_id FROM public.calendar_shares
        WHERE shared_with_user_id = auth.uid() AND can_edit = true
      )
    )
  );

-- Users can update events in their own calendars or calendars where they have edit permission
CREATE POLICY "Users can update events in their calendars"
  ON public.calendar_events
  FOR UPDATE
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
    OR calendar_id IN (
      SELECT calendar_id FROM public.calendar_shares
      WHERE shared_with_user_id = auth.uid() AND can_edit = true
    )
  )
  WITH CHECK (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
    OR calendar_id IN (
      SELECT calendar_id FROM public.calendar_shares
      WHERE shared_with_user_id = auth.uid() AND can_edit = true
    )
  );

-- Users can delete events from their own calendars or calendars where they have edit permission
CREATE POLICY "Users can delete events from their calendars"
  ON public.calendar_events
  FOR DELETE
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
    OR calendar_id IN (
      SELECT calendar_id FROM public.calendar_shares
      WHERE shared_with_user_id = auth.uid() AND can_edit = true
    )
  );

-- RLS Policies for calendar_shares
-- Users can view shares for their own calendars or calendars shared with them
CREATE POLICY "Users can view shares for accessible calendars"
  ON public.calendar_shares
  FOR SELECT
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
    OR shared_with_user_id = auth.uid()
  );

-- Users can create shares for their own calendars
CREATE POLICY "Users can share their own calendars"
  ON public.calendar_shares
  FOR INSERT
  WITH CHECK (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
  );

-- Users can update shares for their own calendars
CREATE POLICY "Users can update shares for their own calendars"
  ON public.calendar_shares
  FOR UPDATE
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
  )
  WITH CHECK (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
  );

-- Users can delete shares from their own calendars
CREATE POLICY "Users can delete shares from their own calendars"
  ON public.calendar_shares
  FOR DELETE
  USING (
    calendar_id IN (
      SELECT id FROM public.calendars WHERE owner_id = auth.uid()
    )
  );
