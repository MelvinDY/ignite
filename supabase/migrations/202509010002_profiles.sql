create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  handle text unique,
  photo_url text,
  banner_url text,
  email text not null,
  pending_new_email text,
  zid varchar(8) unique,
  is_indonesian boolean not null,
  program_id integer,
  major_id integer,
  level level not null,
  year_start integer not null,
  year_grad integer,
  headline varchar,
  domicile_city varchar,
  domicile_country char(2),
  citizenship_status citizenship_type,
  bio text,
  social_links jsonb,
  visibility text not null default 'public',
  status user_status not null default 'PENDING_VERIFICATION',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint handle_format_chk
    check (handle is null or handle ~ '^[a-z0-9_.-]{3,30}$')
);

drop index if exists idx_profiles_email_lower;
create unique index idx_profiles_email_lower on profiles (lower(email));

-- Case-insensitive uniqueness for handle (allows multiple NULLs)
drop index if exists uniq_profiles_handle_ci;
create unique index uniq_profiles_handle_ci
  on profiles (lower(handle))
  where handle is not null;

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();
