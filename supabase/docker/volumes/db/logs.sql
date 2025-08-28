-- Set up logging schema for Supabase Analytics

CREATE SCHEMA IF NOT EXISTS _analytics;

-- Create logs table for analytics
CREATE TABLE IF NOT EXISTS _analytics.logs (
    id BIGSERIAL PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    level TEXT,
    message TEXT,
    metadata JSONB,
    project TEXT DEFAULT 'default'
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS logs_timestamp_idx ON _analytics.logs (timestamp);
CREATE INDEX IF NOT EXISTS logs_project_idx ON _analytics.logs (project);