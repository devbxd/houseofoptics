-- Creating the customer_profiles row from application code, right after
-- calling auth.signUp(), raced the auth.users row becoming visible to a
-- separate follow-up REST call and intermittently failed with a foreign
-- key violation (23503) — the signup itself still succeeded, but the
-- profile silently never got created. A trigger on auth.users runs in the
-- same transaction as the user's creation, so there's nothing to race:
-- this is Supabase's own recommended pattern for a public profile table
-- linked to auth.users.
create or replace function public.handle_new_customer()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.customer_profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_customer();
