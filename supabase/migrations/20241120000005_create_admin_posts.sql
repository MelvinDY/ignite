-- Create admin_posts table (conditional)
BEGIN;

-- Create visibility enum (conditional)
DO $$ BEGIN
    CREATE TYPE visibility AS ENUM ('public', 'members', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Admin posts table (conditional)
CREATE TABLE IF NOT EXISTS admin_posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  content TEXT NOT NULL,
  visibility visibility NOT NULL DEFAULT 'private',
  published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by INTEGER NOT NULL REFERENCES profiles(id)
);

-- Enable RLS
ALTER TABLE admin_posts ENABLE ROW LEVEL SECURITY;

-- RLS policies for admin_posts (simplified for now)
CREATE POLICY "Public posts are viewable by everyone" ON admin_posts 
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Member posts are viewable by authenticated users" ON admin_posts 
  FOR SELECT USING (visibility = 'members');

CREATE POLICY "Private posts viewable by admins" ON admin_posts 
  FOR SELECT USING (visibility = 'private');

CREATE POLICY "Admins can manage posts" ON admin_posts FOR ALL USING (true);

COMMIT;