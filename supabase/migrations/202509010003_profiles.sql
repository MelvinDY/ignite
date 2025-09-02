create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  handle text unique,
  photo_url text,

  is_indonesian boolean not null,
  program_id integer,
  major_id integer,
  level level not null,
  year_start integer not null,
  year_grad integer not null,
  zid varchar(7) unique,

  headline varchar,
  domicile_city varchar,
  domicile_country char(2),
  bio text,
  social_links jsonb,
  visibility text not null default 'public',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated_at on profiles;
create trigger trg_profiles_updated_at
before update on profiles
for each row execute function update_updated_at_column();
