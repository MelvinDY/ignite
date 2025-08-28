-- Create connections table (conditional)
BEGIN;

-- Create connection_status enum (conditional)
DO $$ BEGIN
    CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Connections table (conditional)
CREATE TABLE IF NOT EXISTS connections (
  id SERIAL PRIMARY KEY,
  requester_id INTEGER NOT NULL REFERENCES profiles(id),
  addressee_id INTEGER NOT NULL REFERENCES profiles(id),
  status connection_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(requester_id, addressee_id)
);

-- Create trigger for connections (conditional)
DO $$ BEGIN
    CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add constraint to prevent self-connections (conditional)
DO $$ BEGIN
    ALTER TABLE connections ADD CONSTRAINT no_self_connections CHECK (requester_id != addressee_id);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- RLS policies for connections (simplified for now)
CREATE POLICY "Users can view connections" ON connections FOR SELECT USING (true);
CREATE POLICY "Users can create connection requests" ON connections FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update connections" ON connections FOR UPDATE USING (true);

COMMIT;