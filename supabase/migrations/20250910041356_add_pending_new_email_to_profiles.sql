ALTER TABLE profiles ADD COLUMN pending_new_email text;
COMMENT ON COLUMN profiles.pending_new_email IS 'Stores the new email address when user requests an email change, cleared after verification';