create table if not exists user_otps (
  id uuid primary key default gen_random_uuid(),

  owner_table text not null check (owner_table in ('user_signups','profiles')),
  owner_id uuid not null,
  purpose otp_purpose not null,

  otp_hash text not null,
  expires_at timestamptz not null,
  attempts int not null default 0,
  resend_count int not null default 0,
  last_sent_at timestamptz,
  locked_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (owner_table, owner_id, purpose)
);

create index if not exists idx_user_otps_owner  on user_otps (owner_table, owner_id, purpose);
create index if not exists idx_user_otps_expiry on user_otps (expires_at);

drop trigger if exists trg_user_otps_updated_at on user_otps;
create trigger trg_user_otps_updated_at
before update on user_otps
for each row execute function update_updated_at_column();

create or replace function reset_resend_if_new_day()
returns trigger as $$
begin
  if (tg_op = 'UPDATE') and (new.last_sent_at is not null) and (old.last_sent_at is not null)
     and (new.last_sent_at::date <> old.last_sent_at::date) then
    new.resend_count := 0;
  end if;
  return new;
end $$ language plpgsql;

drop trigger if exists trg_user_otps_reset_resend on user_otps;
create trigger trg_user_otps_reset_resend
before update of last_sent_at on user_otps
for each row execute function reset_resend_if_new_day();
