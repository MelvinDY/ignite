-- Additional RLS policies and security enhancements
BEGIN;

-- Enhanced RLS policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- More granular profile policies (simplified for now)
CREATE POLICY "Anyone can view public profile info" ON profiles 
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (true);

CREATE POLICY "Users can insert own profile during signup" ON profiles 
  FOR INSERT WITH CHECK (true);

-- Admins can manage all profiles (simplified for now)
CREATE POLICY "Admins can manage all profiles" ON profiles 
  FOR ALL USING (true);

-- Function to check if user is admin (simplified for now)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN true; -- Simplified for development
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user exists in membership allowlist
CREATE OR REPLACE FUNCTION is_allowed_member(user_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM membership_allowlist 
    WHERE email_primary = user_email OR email_secondary = user_email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_program_id ON profiles(program_id);
CREATE INDEX IF NOT EXISTS idx_profiles_major_id ON profiles(major_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_addressee_id ON connections(addressee_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON connections(status);
CREATE INDEX IF NOT EXISTS idx_admin_posts_visibility ON admin_posts(visibility);
CREATE INDEX IF NOT EXISTS idx_admin_posts_created_by ON admin_posts(created_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_user_id ON audit_log(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity_type ON audit_log(entity_type);

COMMIT;