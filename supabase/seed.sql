-- -- Seed data for Ignite database
-- BEGIN;

-- -- Clear existing data (if any)
-- TRUNCATE TABLE audit_log, admin_posts, connections, membership_allowlist, profiles, majors, programs RESTART IDENTITY CASCADE;

-- -- Seed programs
-- INSERT INTO programs (name) VALUES 
--   ('Engineering'),
--   ('Computer Science'), 
--   ('Business'),
--   ('Medicine'),
--   ('Law'),
--   ('Arts'),
--   ('Science');

-- -- Seed majors
-- INSERT INTO majors (name, program_id) VALUES
--   -- Engineering majors
--   ('Civil Engineering', 1),
--   ('Mechanical Engineering', 1),
--   ('Electrical Engineering', 1),
--   ('Chemical Engineering', 1),
  
--   -- Computer Science majors
--   ('Software Engineering', 2),
--   ('Computer Engineering', 2),
--   ('Information Systems', 2),
--   ('Cybersecurity', 2),
  
--   -- Business majors
--   ('Business Administration', 3),
--   ('Marketing', 3),
--   ('Finance', 3),
--   ('Accounting', 3),
  
--   -- Medicine majors
--   ('General Medicine', 4),
--   ('Nursing', 4),
--   ('Pharmacy', 4),
  
--   -- Law majors
--   ('Corporate Law', 5),
--   ('Criminal Law', 5),
  
--   -- Arts majors
--   ('Fine Arts', 6),
--   ('Graphic Design', 6),
--   ('Music', 6),
  
--   -- Science majors
--   ('Biology', 7),
--   ('Chemistry', 7),
--   ('Physics', 7),
--   ('Mathematics', 7);

-- -- Seed sample profiles (these will be linked to actual auth users later)
-- INSERT INTO profiles (id, full_name, is_indonesian, program_id, major_id, level, year_start, year_grad, career_title, company, domicile_city, domicile_country, bio, role) VALUES
--   (1, 'Admin User', true, 2, 5, 'undergrad', 2020, 2024, 'System Administrator', 'Ignite Platform', 'Sydney', 'Australia', 'Platform administrator and developer', 'admin'),
--   (2, 'John Doe', true, 1, 1, 'undergrad', 2019, 2023, 'Civil Engineer', 'ABC Engineering', 'Jakarta', 'Indonesia', 'Passionate about infrastructure development', 'member'),
--   (3, 'Jane Smith', false, 2, 5, 'postgrad', 2018, 2022, 'Software Developer', 'Tech Corp', 'Melbourne', 'Australia', 'Full-stack developer with 3 years experience', 'member'),
--   (4, 'Ahmad Rahman', true, 3, 9, 'diploma', 2021, 2023, 'Business Analyst', 'StartupCo', 'Bandung', 'Indonesia', 'Helping businesses grow through data insights', 'member');

-- -- Seed membership allowlist
-- INSERT INTO membership_allowlist (email_primary, email_secondary, zid, full_name, is_indonesian, program_id, major_id, year_intake, notes) VALUES
--   ('john.doe@student.unsw.edu.au', 'john.personal@gmail.com', 'z123456', 'John Doe', true, 1, 1, 2019, 'Active member'),
--   ('jane.smith@student.unsw.edu.au', null, 'z234567', 'Jane Smith', false, 2, 5, 2018, 'Graduate member'),
--   ('ahmad.rahman@student.unsw.edu.au', 'ahmad@email.com', 'z345678', 'Ahmad Rahman', true, 3, 9, 2021, 'Current student'),
--   ('sarah.wilson@student.unsw.edu.au', null, 'z456789', 'Sarah Wilson', false, 4, 13, 2020, 'Medical student');

-- -- Seed sample connections
-- INSERT INTO connections (requester_id, addressee_id, status) VALUES
--   (2, 3, 'accepted'),
--   (2, 4, 'pending'),
--   (3, 4, 'accepted');

-- -- Seed sample admin posts
-- INSERT INTO admin_posts (title, content, visibility, created_by) VALUES
--   ('Welcome to Ignite Platform', 'Welcome everyone to our new networking platform! Connect with fellow Indonesian students at UNSW.', 'public', 1),
--   ('Member Guidelines', 'Please remember to be respectful and professional in all your interactions on the platform.', 'members', 1),
--   ('Platform Maintenance', 'Scheduled maintenance will occur this weekend. Please save your work.', 'private', 1);

-- COMMIT;