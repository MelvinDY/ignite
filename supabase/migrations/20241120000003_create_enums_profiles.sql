-- Create enums and profiles table (conditional)
BEGIN;

-- Create enums (conditional)
DO $$ BEGIN
    CREATE TYPE level AS ENUM ('foundation', 'diploma', 'undergrad', 'postgrad', 'phd');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role AS ENUM ('member', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Profiles table (conditional)
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  photo_url VARCHAR,
  is_indonesian BOOLEAN NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id),
  major_id INTEGER NOT NULL REFERENCES majors(id),
  level level NOT NULL,
  year_start INTEGER NOT NULL,
  year_grad INTEGER NOT NULL,
  career_title VARCHAR,
  company VARCHAR,
  domicile_city VARCHAR,
  domicile_country VARCHAR,
  bio TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  role role NOT NULL DEFAULT 'member'
);

-- Create function to automatically update updated_at (conditional)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profiles (conditional)
DO $$ BEGIN
    CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies for profiles
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (true);

COMMIT;