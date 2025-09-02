-- extensions
create extension if not exists pgcrypto;

-- enums
do $$ begin
  create type level as enum ('foundation','diploma','undergrad','postgrad','phd');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_signup_status as enum ('PENDING_VERIFICATION','ACTIVE','EXPIRED');
exception when duplicate_object then null; end $$;

-- generic updated_at trigger
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;
