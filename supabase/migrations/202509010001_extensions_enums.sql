create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists pg_trgm;

do $$ begin
  create type level as enum ('foundation','diploma','undergrad','postgrad','phd');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_signup_status as enum ('PENDING_VERIFICATION','ACTIVE','EXPIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_status as enum ('ACTIVE','PENDING_VERIFICATION','DISABLED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type otp_purpose as enum ('SIGNUP','EMAIL_CHANGE','RESET_PASSWORD');
exception when duplicate_object then null; end $$;

do $$ begin
  create type employment_type as enum (
    'full_time','part_time','contract','internship','temporary','volunteer','freelance'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type location_type as enum ('on_site','remote','hybrid');
exception when duplicate_object then null; end $$;

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;
