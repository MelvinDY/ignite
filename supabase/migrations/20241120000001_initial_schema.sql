-- Create custom types
CREATE TYPE level AS ENUM ('foundation', 'diploma', 'undergrad', 'postgrad', 'phd');
CREATE TYPE role AS ENUM ('member', 'admin');
CREATE TYPE connection_status AS ENUM ('pending', 'accepted', 'declined');
CREATE TYPE visibility AS ENUM ('public', 'members', 'private');

-- Create programs table
CREATE TABLE programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL
);

-- Create majors table
CREATE TABLE majors (
    id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE NOT NULL,
    program_id INTEGER NOT NULL REFERENCES programs(id)
);

-- Create profiles table
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
    role role NOT NULL
);

-- Create connections table
CREATE TABLE connections (
    id SERIAL PRIMARY KEY,
    requester_id INTEGER NOT NULL REFERENCES profiles(id),
    addressee_id INTEGER NOT NULL REFERENCES profiles(id),
    status connection_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Create admin_posts table
CREATE TABLE admin_posts (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    content TEXT NOT NULL,
    visibility visibility DEFAULT 'private' NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by INTEGER NOT NULL REFERENCES profiles(id)
);

-- Create membership_allowlist table
CREATE TABLE membership_allowlist (
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

-- Create audit_log table
CREATE TABLE audit_log (
    id SERIAL PRIMARY KEY,
    actor_user_id INTEGER NOT NULL REFERENCES profiles(id),
    action TEXT,
    entity_type VARCHAR,
    entity_id INTEGER,
    before_json JSONB,
    after_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_connections_updated_at BEFORE UPDATE ON connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();