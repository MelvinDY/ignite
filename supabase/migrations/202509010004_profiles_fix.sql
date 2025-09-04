alter table user_signups
  add constraint user_signups_profile_fk
  foreign key (profile_id)
  references profiles(id);
