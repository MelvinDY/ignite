-- Add token_version column to user_signups table for token invalidation
ALTER TABLE user_signups 
ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;

-- Create index for efficient token version lookups
CREATE INDEX IF NOT EXISTS idx_user_signups_token_version ON user_signups (token_version);

-- Create RPC function to increment token version
CREATE OR REPLACE FUNCTION increment_token_version(user_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE user_signups 
  SET 
    token_version = token_version + 1,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
