-- Enable real-time for the friends table
-- This allows clients to subscribe to changes on the friends table

ALTER PUBLICATION supabase_realtime ADD TABLE friends;
