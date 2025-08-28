-- Set up Realtime schema and permissions

CREATE SCHEMA IF NOT EXISTS _realtime;

-- Grant necessary permissions for realtime
GRANT USAGE ON SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL TABLES IN SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA _realtime TO supabase_realtime_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA _realtime TO supabase_realtime_admin;

-- Enable realtime on public schema tables
ALTER PUBLICATION supabase_realtime ADD TABLE users;