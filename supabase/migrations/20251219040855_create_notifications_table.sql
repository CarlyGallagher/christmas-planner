-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.calendar_events(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_event_id ON public.notifications(event_id);
CREATE INDEX idx_notifications_scheduled_for ON public.notifications(scheduled_for);
CREATE INDEX idx_notifications_is_read ON public.notifications(user_id, is_read);
CREATE INDEX idx_notifications_pending ON public.notifications(scheduled_for, sent_at)
  WHERE sent_at IS NULL;

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications (will be done via Edge Functions)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Function to create notifications when events with reminders are created
CREATE OR REPLACE FUNCTION public.create_event_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if reminder_minutes is set
  IF NEW.reminder_minutes IS NOT NULL THEN
    INSERT INTO public.notifications (
      user_id,
      event_id,
      message,
      scheduled_for
    )
    VALUES (
      NEW.created_by,
      NEW.id,
      'Reminder: ' || NEW.title || ' starts in ' || NEW.reminder_minutes || ' minutes',
      NEW.start_date - (NEW.reminder_minutes || ' minutes')::INTERVAL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create notifications when events with reminders are created
DROP TRIGGER IF EXISTS on_calendar_event_created ON public.calendar_events;
CREATE TRIGGER on_calendar_event_created
  AFTER INSERT ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.create_event_reminder();

-- Function to update notifications when events are updated
CREATE OR REPLACE FUNCTION public.update_event_reminder()
RETURNS TRIGGER AS $$
BEGIN
  -- If reminder_minutes changed or start_date changed, update the notification
  IF OLD.reminder_minutes IS DISTINCT FROM NEW.reminder_minutes
     OR OLD.start_date IS DISTINCT FROM NEW.start_date
     OR OLD.title IS DISTINCT FROM NEW.title THEN

    -- Delete old notification if it exists and hasn't been sent
    DELETE FROM public.notifications
    WHERE event_id = NEW.id AND sent_at IS NULL;

    -- Create new notification if reminder_minutes is set
    IF NEW.reminder_minutes IS NOT NULL THEN
      INSERT INTO public.notifications (
        user_id,
        event_id,
        message,
        scheduled_for
      )
      VALUES (
        NEW.created_by,
        NEW.id,
        'Reminder: ' || NEW.title || ' starts in ' || NEW.reminder_minutes || ' minutes',
        NEW.start_date - (NEW.reminder_minutes || ' minutes')::INTERVAL
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update notifications when events are updated
DROP TRIGGER IF EXISTS on_calendar_event_updated ON public.calendar_events;
CREATE TRIGGER on_calendar_event_updated
  AFTER UPDATE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.update_event_reminder();
