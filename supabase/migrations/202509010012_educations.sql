create table if not exists educations (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  school_id int references schools(id) on delete set null,
  program_id int references programs(id) on delete set null,
  major_id int references majors(id) on delete set null,

  start_year  int not null check (start_year between 1900 and 2100),
  start_month int not null check (start_month between 1 and 12),
  end_year    int check (end_year between 1900 and 2100),
  end_month   int check (end_month between 1 and 12),

  start_date date generated always as (make_date(start_year, start_month, 1)) stored,
  end_date   date generated always as (
    case when end_year is null or end_month is null then null
         else make_date(end_year, end_month, 1)
    end
  ) stored,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  check ((end_year is null) = (end_month is null)),
  check (end_date is null or start_date <= end_date)
);

create index if not exists idx_educations_profile on educations(profile_id);
create index if not exists idx_educations_school  on educations(school_id);
create index if not exists idx_educations_program on educations(program_id);
create index if not exists idx_educations_major   on educations(major_id);
create index if not exists idx_educations_timeline on educations(profile_id, start_date desc);

drop trigger if exists trg_educations_updated_at on educations;
create trigger trg_educations_updated_at
before update on educations for each row execute function update_updated_at_column();
