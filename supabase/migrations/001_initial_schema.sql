-- Kartex Office — initial schema
-- Run in Supabase SQL Editor (Dashboard → SQL → New query)
-- Project: https://fqmolesnvdknrxfzopio.supabase.co

-- ---------------------------------------------------------------------------
-- Extensions & helpers
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

-- Optional: auto-generate ORD-YYYY-##### when order_number omitted
create sequence if not exists public.order_number_seq start 1000;

create or replace function public.generate_order_number()
returns trigger
language plpgsql
as $$
begin
  if new.order_number is null or btrim(new.order_number) = '' then
    new.order_number := 'ORD-' || to_char(timezone('utc', now()), 'YYYY') || '-' ||
      lpad(nextval('public.order_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null
    constraint customers_type_check
    check (type in ('hospital', 'hotel', 'walk-in')),
  vat text,
  phone text,
  email text,
  address text,
  city text,
  postal_code text,
  payment_terms text,
  credit_limit numeric(12, 2) not null default 0,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create index if not exists customers_type_idx on public.customers (type);
create index if not exists customers_name_idx on public.customers (name);

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sku text not null unique,
  barcode text,
  category text,
  purchase_price numeric(12, 2) not null default 0,
  sale_price numeric(12, 2) not null default 0,
  stock integer not null default 0,
  min_stock integer not null default 0,
  supplier text,
  description text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint products_stock_non_negative check (stock >= 0),
  constraint products_min_stock_non_negative check (min_stock >= 0)
);

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

create index if not exists products_category_idx on public.products (category);
create index if not exists products_barcode_idx on public.products (barcode)
  where barcode is not null;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status text not null default 'Σε Επεξεργασία'
    constraint orders_status_check
    check (
      status in (
        'Σε Επεξεργασία',
        'Αποστολή',
        'Ολοκληρώθηκε',
        'Αναμονή πληρωμής',
        'Ακυρώθηκε'
      )
    ),
  total numeric(12, 2) not null default 0,
  delivery_date date,
  payment_terms text,
  priority text default 'Κανονική'
    constraint orders_priority_check
    check (priority in ('Κανονική', 'Επείγον')),
  notes text,
  internal_notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  created_by uuid references auth.users (id) on delete set null
);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function public.set_updated_at();

create trigger orders_generate_order_number
  before insert on public.orders
  for each row execute function public.generate_order_number();

create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_status_idx on public.orders (status);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_order_number_idx on public.orders (order_number);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  quantity integer not null default 1
    constraint order_items_quantity_positive check (quantity > 0),
  unit_price numeric(12, 2) not null default 0,
  total numeric(12, 2) generated always as (quantity::numeric * unit_price) stored
);

create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists order_items_product_id_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- Row Level Security (authenticated office users — single-tenant MVP)
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- customers
create policy "customers_select_authenticated"
  on public.customers for select to authenticated using (true);
create policy "customers_insert_authenticated"
  on public.customers for insert to authenticated with check (true);
create policy "customers_update_authenticated"
  on public.customers for update to authenticated using (true) with check (true);
create policy "customers_delete_authenticated"
  on public.customers for delete to authenticated using (true);

-- products
create policy "products_select_authenticated"
  on public.products for select to authenticated using (true);
create policy "products_insert_authenticated"
  on public.products for insert to authenticated with check (true);
create policy "products_update_authenticated"
  on public.products for update to authenticated using (true) with check (true);
create policy "products_delete_authenticated"
  on public.products for delete to authenticated using (true);

-- orders
create policy "orders_select_authenticated"
  on public.orders for select to authenticated using (true);
create policy "orders_insert_authenticated"
  on public.orders for insert to authenticated with check (true);
create policy "orders_update_authenticated"
  on public.orders for update to authenticated using (true) with check (true);
create policy "orders_delete_authenticated"
  on public.orders for delete to authenticated using (true);

-- order_items (via parent order access)
create policy "order_items_select_authenticated"
  on public.order_items for select to authenticated using (true);
create policy "order_items_insert_authenticated"
  on public.order_items for insert to authenticated with check (true);
create policy "order_items_update_authenticated"
  on public.order_items for update to authenticated using (true) with check (true);
create policy "order_items_delete_authenticated"
  on public.order_items for delete to authenticated using (true);

-- ---------------------------------------------------------------------------
-- Grants (Supabase API roles)
-- ---------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on all tables in schema public to postgres, service_role;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant select on all tables in schema public to anon;
grant usage, select on sequence public.order_number_seq to authenticated, service_role;
