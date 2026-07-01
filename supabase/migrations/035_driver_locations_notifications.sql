-- Driver GPS tracking, in-app notifications, and customer geocode fields

-- Persist geocoded coordinates on customers (populated by drivers app on first geocode)
alter table public.customers
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- ---------------------------------------------------------------------------
-- driver_locations
-- ---------------------------------------------------------------------------
create table if not exists public.driver_locations (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users (id) on delete cascade,
  trip_id uuid references public.delivery_trips (id) on delete set null,
  lat double precision not null,
  lng double precision not null,
  recorded_at timestamptz not null default timezone('utc', now())
);

create index if not exists driver_locations_driver_id_idx
  on public.driver_locations (driver_id);

create index if not exists driver_locations_trip_id_idx
  on public.driver_locations (trip_id);

create index if not exists driver_locations_recorded_at_idx
  on public.driver_locations (recorded_at desc);

alter table public.driver_locations enable row level security;

create or replace function public.is_office_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role in ('admin', 'warehouse', 'salesperson')
  );
$$;

create policy "driver_locations_insert_own"
  on public.driver_locations for insert to authenticated
  with check (driver_id = auth.uid());

create policy "driver_locations_select_own_or_office"
  on public.driver_locations for select to authenticated
  using (driver_id = auth.uid() or public.is_office_staff());

-- ---------------------------------------------------------------------------
-- driver_notifications
-- ---------------------------------------------------------------------------
create table if not exists public.driver_notifications (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  title text not null,
  body text not null,
  trip_id uuid references public.delivery_trips (id) on delete set null,
  order_id uuid references public.orders (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists driver_notifications_driver_id_idx
  on public.driver_notifications (driver_id);

create index if not exists driver_notifications_driver_unread_idx
  on public.driver_notifications (driver_id, read_at)
  where read_at is null;

create index if not exists driver_notifications_created_at_idx
  on public.driver_notifications (created_at desc);

alter table public.driver_notifications enable row level security;

create policy "driver_notifications_select_own"
  on public.driver_notifications for select to authenticated
  using (driver_id = auth.uid());

create policy "driver_notifications_insert_own"
  on public.driver_notifications for insert to authenticated
  with check (driver_id = auth.uid());

create policy "driver_notifications_update_own"
  on public.driver_notifications for update to authenticated
  using (driver_id = auth.uid())
  with check (driver_id = auth.uid());

-- Realtime: office can subscribe to live driver positions
do $$
begin
  alter publication supabase_realtime add table public.driver_locations;
exception
  when duplicate_object then null;
end $$;
