-- Create a shared type for user statuses to ensure consistency
CREATE TYPE public.user_status AS ENUM ('ACTIVE', 'PENDING_VERIFICATION', 'DISABLED');

-- Add the new status column to the profiles table
-- By default, new users will be 'PENDING_VERIFICATION'
ALTER TABLE public.profiles
ADD COLUMN status public.user_status NOT NULL DEFAULT 'PENDING_VERIFICATION';
