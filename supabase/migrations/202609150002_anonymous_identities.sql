alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists anonymous_address text;
create unique index if not exists profiles_username_lower_unique on public.profiles(lower(username)) where username is not null;
create unique index if not exists profiles_anonymous_address_unique on public.profiles(anonymous_address) where anonymous_address is not null;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[a-z0-9][a-z0-9._-]{1,31}$');
alter table public.profiles drop constraint if exists profiles_anonymous_address_format;
alter table public.profiles add constraint profiles_anonymous_address_format check (anonymous_address is null or anonymous_address ~ '^[a-z0-9][a-z0-9.-]{1,31}@xythol$');
