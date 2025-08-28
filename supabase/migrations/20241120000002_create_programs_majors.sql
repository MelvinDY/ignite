-- Create programs and majors tables (if they don't exist)
BEGIN;

-- Programs table (conditional creation)
CREATE TABLE IF NOT EXISTS programs (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL
);

-- Majors table (conditional creation)
CREATE TABLE IF NOT EXISTS majors (
  id SERIAL PRIMARY KEY,
  name VARCHAR UNIQUE NOT NULL,
  program_id INTEGER NOT NULL REFERENCES programs(id)
);

-- Insert all programs first (avoid duplicates)
INSERT INTO programs (name) VALUES 
  ('Engineering'),
  ('Computer Science'),
  ('Business'),
  ('Medicine'),
  ('Law'),
  ('Arts'),
  ('Science')
ON CONFLICT (name) DO NOTHING;

-- Insert majors using program IDs (avoid duplicates)
INSERT INTO majors (name, program_id) VALUES
  -- Engineering majors (program_id = 1)
  ('Civil Engineering', 1),
  ('Mechanical Engineering', 1),
  ('Electrical Engineering', 1),
  ('Chemical Engineering', 1),
  
  -- Computer Science majors (program_id = 2)
  ('Software Engineering', 2),
  ('Computer Engineering', 2),
  ('Information Systems', 2),
  ('Cybersecurity', 2),
  
  -- Business majors (program_id = 3)
  ('Business Administration', 3),
  ('Marketing', 3),
  ('Finance', 3),
  ('Accounting', 3),
  
  -- Medicine majors (program_id = 4)
  ('General Medicine', 4),
  ('Nursing', 4),
  ('Pharmacy', 4),
  
  -- Law majors (program_id = 5)
  ('Corporate Law', 5),
  ('Criminal Law', 5),
  
  -- Arts majors (program_id = 6)
  ('Fine Arts', 6),
  ('Graphic Design', 6),
  ('Music', 6),
  
  -- Science majors (program_id = 7)
  ('Biology', 7),
  ('Chemistry', 7),
  ('Physics', 7),
  ('Mathematics', 7)
ON CONFLICT (name) DO NOTHING;

-- Enable RLS
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE majors ENABLE ROW LEVEL SECURITY;

-- RLS policies for programs (readable by all authenticated users)
CREATE POLICY "Programs are viewable by authenticated users" ON programs FOR SELECT USING (auth.role() = 'authenticated');

-- RLS policies for majors (readable by all authenticated users)
CREATE POLICY "Majors are viewable by authenticated users" ON majors FOR SELECT USING (auth.role() = 'authenticated');

COMMIT;