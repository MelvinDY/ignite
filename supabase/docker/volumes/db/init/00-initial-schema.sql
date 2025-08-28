-- Initial schema setup for Ignite self-hosted Supabase
BEGIN;

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums first
CREATE TYPE level AS ENUM ('foundation', 'diploma', 'undergrad', 'postgrad', 'phd');
CREATE TYPE role AS ENUM ('member', 'admin');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE visibility AS ENUM ('public', 'members', 'private');

-- Programs table
CREATE TABLE programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL
);

-- Majors table  
CREATE TABLE majors (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id)
);

-- Profiles table (main user profiles)
CREATE TABLE profiles (
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

-- Insert sample data
INSERT INTO programs (name) VALUES 
  ('Engineering'),
  ('Computer Science'),
  ('Business'),
  ('Medicine'),
  ('Law'),
  ('Arts');

INSERT INTO majors (name, program_id) VALUES
  ('Software Engineering', 2),
  ('Computer Engineering', 1),
  ('Electrical Engineering', 1),
  ('Mechanical Engineering', 1),
  ('Business Administration', 3),
  ('Marketing', 3),
  ('General Medicine', 4),
  ('Corporate Law', 5),
  ('Fine Arts', 6);

-- Enable RLS on all tables
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "Programs are viewable by all" ON programs FOR SELECT USING (true);
CREATE POLICY "Majors are viewable by all" ON majors FOR SELECT USING (true);
CREATE POLICY "Profiles are viewable by all" ON profiles FOR SELECT USING (true);

COMMIT;