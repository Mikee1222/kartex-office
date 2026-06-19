-- Site-wide key/value settings (website + office admin)

create table if not exists public.settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists settings_key_idx on public.settings (key);

drop trigger if exists settings_set_updated_at on public.settings;
create trigger settings_set_updated_at
  before update on public.settings
  for each row execute function public.set_updated_at();

alter table public.settings enable row level security;

drop policy if exists "settings_authenticated_all" on public.settings;
create policy "settings_authenticated_all" on public.settings
  for all to authenticated using (true) with check (true);

drop policy if exists "settings_service_role_all" on public.settings;
create policy "settings_service_role_all" on public.settings
  for all to service_role using (true) with check (true);

grant select, insert, update, delete on public.settings to authenticated;
grant select, insert, update, delete on public.settings to service_role;

insert into public.settings (key, value) values
  ('maintenance_mode', 'false'::jsonb),
  ('show_prices', 'false'::jsonb),
  ('site_name', '"Kartex"'::jsonb),
  ('contact_email', '"kartex@kartex.gr"'::jsonb),
  ('contact_phone', '"+30 210 2846533"'::jsonb),
  ('contact_address', '"Κορίνθου 15, Μεταμόρφωση 144 51"'::jsonb),
  ('social_links', '{}'::jsonb)
on conflict (key) do nothing;
