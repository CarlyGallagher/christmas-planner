-- Create friends table for managing friend connections
CREATE TABLE IF NOT EXISTS friends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  friend_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Ensure a user can't friend themselves
  CONSTRAINT no_self_friend CHECK (user_id != friend_id),

  -- Ensure unique friendship pairs (prevent duplicates)
  CONSTRAINT unique_friendship UNIQUE (user_id, friend_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS friends_user_id_idx ON friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_id_idx ON friends(friend_id);
CREATE INDEX IF NOT EXISTS friends_status_idx ON friends(status);

-- Enable RLS
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friends table

-- Users can view their own friend requests (sent and received)
DROP POLICY IF EXISTS "Users can view their friend connections" ON friends;
CREATE POLICY "Users can view their friend connections"
ON friends
FOR SELECT
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can send friend requests
DROP POLICY IF EXISTS "Users can send friend requests" ON friends;
CREATE POLICY "Users can send friend requests"
ON friends
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND status = 'pending'
);

-- Users can update friend requests they received (accept/decline)
-- or update requests they sent (cancel/block)
DROP POLICY IF EXISTS "Users can update friend requests" ON friends;
CREATE POLICY "Users can update friend requests"
ON friends
FOR UPDATE
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
)
WITH CHECK (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Users can delete friend connections they're part of
DROP POLICY IF EXISTS "Users can delete friend connections" ON friends;
CREATE POLICY "Users can delete friend connections"
ON friends
FOR DELETE
USING (
  auth.uid() = user_id OR auth.uid() = friend_id
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_friends_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS friends_updated_at ON friends;
CREATE TRIGGER friends_updated_at
  BEFORE UPDATE ON friends
  FOR EACH ROW
  EXECUTE FUNCTION update_friends_updated_at();
