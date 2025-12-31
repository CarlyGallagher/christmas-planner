-- Fix calendar RLS policies to eliminate infinite recursion
-- Similar to the wishlist fix, we need to break circular dependencies

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Users can view their own calendars" ON calendars;
DROP POLICY IF EXISTS "Users can view events from accessible calendars" ON calendar_events;
DROP POLICY IF EXISTS "Users can view shares for accessible calendars" ON calendar_shares;
DROP POLICY IF EXISTS "users_view_owned_and_shared_calendars" ON calendars;
DROP POLICY IF EXISTS "users_view_events_from_accessible_calendars" ON calendar_events;

-- STEP 1: Make calendar_shares readable by all authenticated users
-- This breaks the circular dependency
DROP POLICY IF EXISTS "authenticated_users_view_calendar_shares" ON calendar_shares;

CREATE POLICY "authenticated_users_view_calendar_shares"
  ON calendar_shares
  FOR SELECT
  TO authenticated
  USING (true);

-- STEP 2: Allow calendars to be viewed by owner OR users it's shared with
CREATE POLICY "users_view_owned_and_shared_calendars"
  ON calendars
  FOR SELECT
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.calendar_id = calendars.id
      AND calendar_shares.shared_with_user_id = auth.uid()
    )
  );

-- STEP 3: Allow events to be viewed from accessible calendars
-- Use EXISTS to avoid recursion
CREATE POLICY "users_view_events_from_accessible_calendars"
  ON calendar_events
  FOR SELECT
  USING (
    -- Events from calendars the user owns
    calendar_id IN (
      SELECT id FROM calendars WHERE owner_id = auth.uid()
    )
    OR
    -- Events from calendars shared with the user
    EXISTS (
      SELECT 1 FROM calendar_shares
      WHERE calendar_shares.calendar_id = calendar_events.calendar_id
      AND calendar_shares.shared_with_user_id = auth.uid()
    )
  );
