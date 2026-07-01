-- Product categories + payment terms + customer type labels (settings lookups)
-- Run after 016_product_colors.sql

create table if not exists public.product_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.product_categories enable row level security;

drop policy if exists "categories_all" on public.product_categories;
create policy "categories_all" on public.product_categories
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.product_categories to authenticated;

insert into public.product_categories (name)
values
  ('Σεντόνια'),
  ('Πετσέτες'),
  ('Στολές'),
  ('Μαξιλαροθήκες'),
  ('Παπλώματα'),
  ('Άλλο')
on conflict (name) do nothing;

-- Payment term options (display labels stored on customers/orders)
create table if not exists public.payment_term_options (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.payment_term_options enable row level security;

drop policy if exists "payment_term_options_all" on public.payment_term_options;
create policy "payment_term_options_all" on public.payment_term_options
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.payment_term_options to authenticated;

insert into public.payment_term_options (name, sort_order)
values
  ('Άμεση', 1),
  ('30 μέρες', 2),
  ('60 μέρες', 3),
  ('90 μέρες', 4)
on conflict (name) do nothing;

-- Customer type labels (maps to customers.type db keys)
create table if not exists public.customer_type_options (
  id uuid primary key default gen_random_uuid(),
  label text not null unique,
  db_key text not null
    constraint customer_type_options_db_key_check
    check (db_key in ('hospital', 'hotel', 'walk-in')),
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  constraint customer_type_options_db_key_unique unique (db_key)
);

alter table public.customer_type_options enable row level security;

drop policy if exists "customer_type_options_all" on public.customer_type_options;
create policy "customer_type_options_all" on public.customer_type_options
  for all to authenticated using (true) with check (true);

grant select, insert, update, delete on public.customer_type_options to authenticated;

insert into public.customer_type_options (label, db_key, sort_order)
values
  ('Νοσοκομείο', 'hospital', 1),
  ('Ξενοδοχείο', 'hotel', 2),
  ('Walk-in', 'walk-in', 3)
on conflict (db_key) do nothing;
