-- Add citizenship_status column if it doesn't exist
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS citizenship_status citizenship_type;