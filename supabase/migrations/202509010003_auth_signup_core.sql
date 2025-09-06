create table if not exists user_signups (
  id uuid primary key default gen_random_uuid(),

  -- lifecycle
  status user_signup_status not null default 'PENDING_VERIFICATION',
  email_verified_at timestamptz,

  -- staged registration payload
  signup_email   text not null,
  full_name      text not null,
  zid            varchar(8) not null,
  level          level not null,
  year_intake    integer not null,
  is_indonesian  boolean not null,
  program        text not null,
  major          text not null,

  -- auth temp
  password_hash  text not null,

  -- resume token (hash + ttl stored here)
  resume_token_hash text,
  resume_token_expires_at timestamptz,

  -- link to final profile (NULL until activation)
  profile_id uuid references profiles(id),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_user_signups_email  on user_signups (lower(signup_email));
create index if not exists idx_user_signups_zid    on user_signups (zid);
create index if not exists idx_user_signups_status on user_signups (status);

drop trigger if exists trg_user_signups_updated_at on user_signups;
create trigger trg_user_signups_updated_at
before update on user_signups
for each row execute function update_updated_at_column();
