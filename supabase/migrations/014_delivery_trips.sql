-- Delivery trips (δρομολόγια): multi-stop routes per driver per day

create table if not exists public.delivery_trips (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users (id) on delete cascade,
  driver_name text not null,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  trip_date date not null,
  status text not null default 'pending'
    check (status in ('pending', 'in_progress', 'completed')),
  total_boxes integer not null default 0 check (total_boxes >= 0),
  notes text,
  departed_at timestamptz,
  returned_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists delivery_trips_driver_date_idx
  on public.delivery_trips (driver_id, trip_date);

create index if not exists delivery_trips_date_idx
  on public.delivery_trips (trip_date);

create index if not exists delivery_trips_status_idx
  on public.delivery_trips (status);

alter table public.orders
  add column if not exists trip_id uuid references public.delivery_trips (id) on delete set null;

create index if not exists orders_trip_id_idx on public.orders (trip_id);

alter table public.delivery_trips enable row level security;

create policy "delivery_trips_select_authenticated"
  on public.delivery_trips for select to authenticated using (true);

create policy "delivery_trips_insert_authenticated"
  on public.delivery_trips for insert to authenticated with check (true);

create policy "delivery_trips_update_authenticated"
  on public.delivery_trips for update to authenticated using (true);

create policy "delivery_trips_delete_authenticated"
  on public.delivery_trips for delete to authenticated using (true);
