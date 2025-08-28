-- JWT configuration and functions for Supabase Auth

BEGIN;

-- Install pgjwt extension if available
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Create JWT configuration table
CREATE TABLE IF NOT EXISTS auth.jwt_secret (
    secret TEXT NOT NULL
);

-- Insert JWT secret (this should match your JWT_SECRET env var)
INSERT INTO auth.jwt_secret (secret) 
VALUES ('your-super-secret-jwt-token-with-at-least-32-characters-long')
ON CONFLICT DO NOTHING;

COMMIT;