alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists anonymous_address text;

create unique index if not exists profiles_username_lower_unique
  on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_anonymous_address_unique
  on public.profiles(anonymous_address) where anonymous_address is not null;

alter table public.profiles enable row level security;
drop policy if exists profiles_owner_tauri on public.profiles;
create policy profiles_owner_tauri
  on public.profiles
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
