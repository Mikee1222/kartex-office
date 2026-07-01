-- Fleet: vehicles, driver vehicle assignment, daily box capacity

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  plate text not null,
  model text,
  max_boxes integer not null check (max_boxes > 0),
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint vehicles_plate_unique unique (plate)
);

create index if not exists vehicles_is_active_idx on public.vehicles (is_active);

alter table public.user_roles
  add column if not exists vehicle_id uuid references public.vehicles (id) on delete set null;

create index if not exists user_roles_vehicle_id_idx on public.user_roles (vehicle_id);

alter table public.orders
  add column if not exists vehicle_id uuid references public.vehicles (id) on delete set null;

create index if not exists orders_vehicle_id_idx on public.orders (vehicle_id);

create table if not exists public.driver_schedules (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references auth.users (id) on delete cascade,
  vehicle_id uuid references public.vehicles (id) on delete set null,
  schedule_date date not null,
  total_boxes integer not null default 0 check (total_boxes >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint driver_schedules_driver_date_unique unique (driver_id, schedule_date)
);

create index if not exists driver_schedules_date_idx on public.driver_schedules (schedule_date);

alter table public.vehicles enable row level security;
alter table public.driver_schedules enable row level security;

create policy "vehicles_select_authenticated"
  on public.vehicles for select to authenticated using (true);

create policy "vehicles_insert_authenticated"
  on public.vehicles for insert to authenticated with check (true);

create policy "vehicles_update_authenticated"
  on public.vehicles for update to authenticated using (true);

create policy "driver_schedules_select_authenticated"
  on public.driver_schedules for select to authenticated using (true);

create policy "driver_schedules_insert_authenticated"
  on public.driver_schedules for insert to authenticated with check (true);

create policy "driver_schedules_update_authenticated"
  on public.driver_schedules for update to authenticated using (true);
