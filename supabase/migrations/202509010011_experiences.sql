-- Experiences
drop table if exists experiences cascade;
create table experiences (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,

  -- lookups (Approach A: text -> ensure/create in lookup -> save id)
  company_id int references companies(id) on delete set null,
  field_of_work_id int references fields_of_work(id) on delete set null,

  -- role title the user actually held (keep as text, independent of field_of_work)
  role_title text not null,

  -- employment & location metadata
  employment_type employment_type,
  location_city varchar,
  location_country char(2),
  location_type location_type,

  -- timeline with month precision + generated dates for easy sorting/filtering
  start_year  int not null check (start_year between 1900 and 2100),
  start_month int not null check (start_month between 1 and 12),
  end_year    int check (end_year between 1900 and 2100),
  end_month   int check (end_month between 1 and 12),
  is_current  boolean not null default false,

  start_date date generated always as (make_date(start_year, start_month, 1)) stored,
  end_date   date generated always as (
    case when end_year is null or end_month is null then null
         else make_date(end_year, end_month, 1)
    end
  ) stored,

  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- enforce “current” vs “ended” consistency
  check (
    (is_current = true  and end_year is null and end_month is null) or
    (is_current = false and end_year is not null and end_month is not null)
  ),
  -- timeline sanity
  check (end_date is null or start_date <= end_date)
);

create index if not exists idx_experiences_profile   on experiences(profile_id);
create index if not exists idx_experiences_company   on experiences(company_id);
create index if not exists idx_experiences_field     on experiences(field_of_work_id);
create index if not exists idx_experiences_current   on experiences(profile_id) where is_current = true;
create index if not exists idx_experiences_timeline  on experiences(profile_id, start_date desc);
create index if not exists idx_experiences_emp_type  on experiences(employment_type);
create index if not exists idx_experiences_loc_type  on experiences(location_type);

drop trigger if exists trg_experiences_updated_at on experiences;
create trigger trg_experiences_updated_at
before update on experiences
for each row execute function update_updated_at_column();
