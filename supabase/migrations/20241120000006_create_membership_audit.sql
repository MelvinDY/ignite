-- Create membership_allowlist and audit_log tables
BEGIN;

-- Membership allowlist table (conditional)
CREATE TABLE IF NOT EXISTS membership_allowlist (
  id SERIAL PRIMARY KEY,
  email_primary VARCHAR UNIQUE NOT NULL,
  email_secondary VARCHAR,
  zid VARCHAR(7) UNIQUE NOT NULL,
  full_name VARCHAR NOT NULL,
  is_indonesian BOOLEAN NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  major_id INTEGER NOT NULL REFERENCES majors(id),
  year_intake INTEGER NOT NULL,
  notes TEXT
);

-- Audit log table (conditional)
CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER NOT NULL REFERENCES profiles(id),
  action TEXT,
  entity_type VARCHAR,
  entity_id INTEGER,
  before_json JSONB,
  after_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE membership_allowlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS policies for membership_allowlist (simplified for now)
CREATE POLICY "Admins can view membership allowlist" ON membership_allowlist FOR SELECT USING (true);
CREATE POLICY "Admins can manage membership allowlist" ON membership_allowlist FOR ALL USING (true);

-- RLS policies for audit_log (simplified for now)
CREATE POLICY "Admins can view audit logs" ON audit_log FOR SELECT USING (true);

-- Function to create audit log entries
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, before_json)
    VALUES (
      1, -- Default admin user for now
      TG_OP,
      TG_TABLE_NAME,
      OLD.id,
      to_jsonb(OLD)
    );
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, before_json, after_json)
    VALUES (
      1, -- Default admin user for now
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(OLD),
      to_jsonb(NEW)
    );
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, after_json)
    VALUES (
      1, -- Default admin user for now
      TG_OP,
      TG_TABLE_NAME,
      NEW.id,
      to_jsonb(NEW)
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add audit triggers to important tables
CREATE TRIGGER profiles_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER connections_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON connections
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER admin_posts_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON admin_posts
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

COMMIT;